using System.Text;

namespace SoyCrunch.Api.Game;

public sealed class GameService(TimeProvider clock)
{
    public const int Capacity = 24;
    private readonly object gate = new();
    private readonly Dictionary<string, Guest> guests = [];
    private readonly Dictionary<string, DateTimeOffset> lastOrders = [];
    private readonly List<FoodOrder> orders = [];
    private readonly List<FeedEntry> feed = [];
    private readonly HashSet<string> seen = [];
    private readonly Queue<string> seenOrder = [];
    private readonly string[] demoNames = ["Minh Anh", "Bảo Ngọc", "Hoàng Nam", "Linh", "Hà My", "Tuấn", "Bắp", "An Nhiên", "Khánh", "Mây", "Hải", "Thảo", "Đậu", "Sóc", "Ngọc", "Bình", "Phúc", "Vy", "Mai", "Duy", "Kem", "Trâm", "Sơn", "Hân"];
    private DateTimeOffset startedAt = clock.GetUtcNow();
    private DateTimeOffset nextDemoAt;
    private long revision = clock.GetUtcNow().ToUnixTimeMilliseconds();
    private int served;
    private long likes, diamonds;
    private bool demoRunning;
    private ShopSettings settings = new("Sữa & Giòn");
    private ConnectorState connector = new("idle", "", "Chưa kết nối TikTok");

    public SessionSnapshot Snapshot() { lock (gate) return SnapshotUnsafe(); }

    public EventResult Handle(IncomingEvent input)
    {
        Validate(input);
        lock (gate)
        {
            var now = clock.GetUtcNow();
            if (input.Type == "gift" && input.GiftType == 1 && !input.RepeatEnd)
                return Result("ignored", "Combo quà chưa kết thúc");
            if (!seen.Add(input.EventId)) return Result("duplicate", "Sự kiện đã được xử lý");
            seenOrder.Enqueue(input.EventId);
            // shortcut: deduplicate the latest 5,000 IDs in this session; persist IDs when replay across restarts is required.
            if (seenOrder.Count > 5_000) seen.Remove(seenOrder.Dequeue());

            if (input.Type == "like")
            {
                likes += input.LikeCount;
                if (guests.TryGetValue(input.ViewerId, out var liker))
                    guests[liker.Id] = liker with { LastSeenAt = now, Reaction = "like", ReactionAt = now };
                Changed();
                return Result("accepted", "Đã nhận tim");
            }

            guests.TryGetValue(input.ViewerId, out var guest);
            if (guest is null && guests.Count < Capacity)
            {
                var seat = Enumerable.Range(0, Capacity).First(i => guests.Values.All(g => g.Seat != i));
                guest = new(input.ViewerId, Clean(input.Name, 24), seat, input.Demo, 0, now, now);
                guests.Add(guest.Id, guest);
                AddFeed("join", $"{guest.Name} ghé quán");
                Changed();
            }

            if (input.Type == "gift")
            {
                var amount = (long)input.DiamondCount * input.RepeatCount;
                diamonds += amount;
                if (guest is not null)
                    guests[guest.Id] = guest with { Diamonds = guest.Diamonds + amount, LastSeenAt = now, Reaction = "gift", ReactionAt = now };
                AddFeed("gift", $"Cảm ơn {Clean(input.Name, 24)}: {Clean(input.GiftName ?? "quà", 40)} ×{input.RepeatCount}");
                Changed();
                return Result("accepted", "Đã nhận quà");
            }

            if (guest is null) return Result("full", "Quán đủ 24 khách, mời chờ một chút");
            guest = guest with { LastSeenAt = now };
            if (input.Type == "join")
            {
                guests[guest.Id] = guest;
                Changed();
                return Result("accepted", "Đã vào quán");
            }

            var text = Clean(input.Text ?? "", 120);
            guests[guest.Id] = guest with { Text = text, TextUntil = now.AddSeconds(5) };
            Changed();
            var item = text.Trim().ToLowerInvariant().Normalize() switch
            {
                "!sua" or "!sữa" => "milk",
                "!banh" or "!bánh" => "rice-paper",
                _ => null
            };
            if (item is null) return Result("accepted", "Đã nhận bình luận");
            if (!settings.AcceptingOrders) return Result("closed", "Quán đang ngưng nhận món");
            if (orders.Any(o => o.GuestId == guest.Id)) return Result("busy", "Khách đang có một món");
            if (lastOrders.TryGetValue(guest.Id, out var last) && now - last < TimeSpan.FromSeconds(8))
                return Result("cooldown", "Chờ đủ 8 giây giữa hai lần gọi món");
            orders.Add(new(Guid.NewGuid().ToString("N"), guest.Id, item, "queued", now));
            lastOrders[guest.Id] = now;
            AddFeed("order", $"{guest.Name} gọi {ItemName(item)}");
            Changed();
            return Result("accepted", "Bếp đã nhận món");
        }
    }

    public SessionSnapshot Tick()
    {
        lock (gate)
        {
            var now = clock.GetUtcNow();
            foreach (var order in orders.ToArray())
            {
                if (order.Until is null || order.Until > now) continue;
                var index = orders.IndexOf(order);
                switch (order.State)
                {
                    case "cooking": orders[index] = order with { State = "serving", Until = order.Until.Value.AddSeconds(1) }; break;
                    case "serving": orders[index] = order with { State = "consuming", Until = order.Until.Value.AddSeconds(6) }; break;
                    case "consuming":
                        orders.RemoveAt(index);
                        served++;
                        AddFeed("served", $"{guests[order.GuestId].Name} dùng xong {ItemName(order.Item)}");
                        break;
                }
                Changed();
            }
            if (orders.All(o => o.State != "cooking"))
            {
                var next = orders.FirstOrDefault(o => o.State == "queued");
                if (next is not null)
                {
                    orders[orders.IndexOf(next)] = next with { State = "cooking", Until = now.AddSeconds(next.Item == "milk" ? 2 : 4) };
                    Changed();
                }
            }
            foreach (var guest in guests.Values.Where(g => now - g.LastSeenAt > TimeSpan.FromSeconds(120) && orders.All(o => o.GuestId != g.Id)).ToArray())
            {
                guests.Remove(guest.Id);
                lastOrders.Remove(guest.Id);
                Changed();
            }
            if (demoRunning && now >= nextDemoAt)
            {
                nextDemoAt = now.AddSeconds(1.8);
                var demoGuests = guests.Values.Where(g => g.Demo).ToArray();
                if (demoGuests.Length > 0)
                {
                    var g = demoGuests[Random.Shared.Next(demoGuests.Length)];
                    var kind = Random.Shared.Next(10);
                    Handle(new(Guid.NewGuid().ToString("N"), g.Id, g.Name,
                        kind < 7 ? "chat" : "like", kind % 2 == 0 ? "!sua" : "!banh", LikeCount: Random.Shared.Next(1, 6), Demo: true));
                }
            }
            return SnapshotUnsafe();
        }
    }

    public SessionSnapshot UpdateSettings(ShopSettings value)
    {
        if (string.IsNullOrWhiteSpace(value.Title) || value.Title.Length > 40)
            throw new ArgumentException("Tên quán cần từ 1 đến 40 ký tự");
        lock (gate) { settings = value with { Title = Clean(value.Title, 40) }; Changed(); return SnapshotUnsafe(); }
    }

    public SessionSnapshot SetDemo(bool enabled)
    {
        lock (gate)
        {
            demoRunning = enabled;
            if (enabled)
                for (var i = 0; i < 12; i++)
                    Handle(new(Guid.NewGuid().ToString("N"), $"demo-{i}", demoNames[i], "join", Demo: true));
            Changed();
            return SnapshotUnsafe();
        }
    }

    public SessionSnapshot Reset()
    {
        lock (gate)
        {
            guests.Clear(); orders.Clear(); feed.Clear(); seen.Clear(); seenOrder.Clear(); lastOrders.Clear();
            served = 0; likes = 0; diamonds = 0; demoRunning = false; startedAt = clock.GetUtcNow();
            AddFeed("system", "Phiên mới đã bắt đầu"); Changed();
            return SnapshotUnsafe();
        }
    }

    public void SetConnector(ConnectorState state) { lock (gate) { connector = state; Changed(); } }
    public void SetConnectorStatus(string status, string message)
    { lock (gate) { connector = connector with { Status = status, Message = message }; Changed(); } }
    public void ConnectorEventReceived(string type)
    {
        lock (gate)
        {
            connector = connector with
            {
                LastEventAt = clock.GetUtcNow(),
                ChatEvents = connector.ChatEvents + (type == "chat" ? 1 : 0),
                LikeEvents = connector.LikeEvents + (type == "like" ? 1 : 0),
                GiftEvents = connector.GiftEvents + (type == "gift" ? 1 : 0),
                JoinEvents = connector.JoinEvents + (type == "join" ? 1 : 0)
            };
            Changed();
        }
    }
    public static string ItemName(string item) => item == "milk" ? "sữa đậu nành" : "bánh tráng nướng";
    private EventResult Result(string outcome, string message) => new(outcome, message, SnapshotUnsafe());
    private void Changed() => revision = Math.Max(revision + 1, clock.GetUtcNow().ToUnixTimeMilliseconds());
    private void AddFeed(string kind, string text)
    {
        feed.Add(new(Guid.NewGuid().ToString("N"), kind, text, clock.GetUtcNow()));
        if (feed.Count > 40) feed.RemoveAt(0);
    }
    private SessionSnapshot SnapshotUnsafe() => new(revision, startedAt, clock.GetUtcNow(), settings,
        guests.Values.OrderBy(g => g.Seat).ToArray(), orders.ToArray(), feed.ToArray(),
        new(served, likes, diamonds), demoRunning, connector);
    private static string Clean(string text, int length) => string.Concat(text.Trim().EnumerateRunes()
        .Where(r => !Rune.IsControl(r)).Take(length).Select(r => r.ToString()));

    private static void Validate(IncomingEvent e)
    {
        if (string.IsNullOrWhiteSpace(e.EventId) || e.EventId.Length > 180 || e.EventId.Any(char.IsControl)
            || string.IsNullOrWhiteSpace(e.ViewerId) || e.ViewerId.Length > 100 || e.ViewerId.Any(char.IsControl))
            throw new ArgumentException("eventId/viewerId thiếu hoặc không hợp lệ");
        if (string.IsNullOrWhiteSpace(e.Name) || e.Name.Length > 200 || string.IsNullOrWhiteSpace(Clean(e.Name, 24)))
            throw new ArgumentException("Tên người xem không hợp lệ");
        if (e.Type is not ("join" or "chat" or "like" or "gift")) throw new ArgumentException("Loại sự kiện không hợp lệ");
        if (e.Text?.Length > 2_000 || e.GiftName?.Length > 200) throw new ArgumentException("Nội dung quá dài");
        if (e.LikeCount is < 1 or > 10_000 || e.DiamondCount is < 0 or > 50_000 || e.RepeatCount is < 1 or > 10_000)
            throw new ArgumentException("Số lượng tim/quà ngoài giới hạn");
    }
}
