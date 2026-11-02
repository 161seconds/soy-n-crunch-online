using System.Text.RegularExpressions;
using SoyCrunch.Api.Game;
using TikTokLiveSharp.Client;
using TikTokLiveSharp.Client.Config;
using TikTokLiveSharp.Events;
using TikTokLiveSharp.Events.Objects;

namespace SoyCrunch.Api;

public sealed class TikTokConnector(GameService game, IHostApplicationLifetime lifetime, ILogger<TikTokConnector> logger) : IAsyncDisposable
{
    private readonly SemaphoreSlim lifecycle = new(1, 1);
    private volatile TikTokLiveClient? client;
    private CancellationTokenSource? cancellation;

    public async Task<SessionSnapshot> ConnectAsync(string username, CancellationToken requestToken = default)
    {
        username = NormalizeUsername(username);
        await lifecycle.WaitAsync(requestToken);
        try
        {
            await StopUnsafe();
            game.SetConnector(new("connecting", username, $"Đang tìm phòng LIVE của @{username}…"));
            var settings = Constants.DEFAULT_SETTINGS;
            settings.Timeout = 8;
            settings.PrintToConsole = false;
            settings.HandleExistingMessagesOnConnect = false;
            settings.RetryOnConnectionFailure = false;
            var connection = new TikTokLiveClient(username, settings: settings);
            client = connection;
            cancellation = CancellationTokenSource.CreateLinkedTokenSource(lifetime.ApplicationStopping);
            var token = cancellation.Token;
            bool Active() => ReferenceEquals(client, connection) && !token.IsCancellationRequested;
            TikTokEvents.Attach(connection, input =>
            {
                if (!Active()) return;
                try { game.Handle(input); game.ConnectorEventReceived(input.Type); }
                catch (ArgumentException error) { logger.LogWarning("Ignored malformed TikTok event: {Message}", error.Message); }
            });
            connection.OnDisconnected += (_, _) =>
            {
                if (Active()) game.SetConnectorStatus("disconnected", "TikTok đã ngắt kết nối. Bấm Kết nối để thử lại.");
            };
            try
            {
                var room = await connection.Start(token, retryConnection: false).WaitAsync(TimeSpan.FromSeconds(20), requestToken);
                if (!connection.Connected || string.IsNullOrEmpty(room)) throw new InvalidOperationException("Chưa mở được kết nối tới phòng LIVE");
                game.SetConnectorStatus("connected", $"Đã kết nối @{username} · phòng {room}. Đang chờ tương tác thật.");
            }
            catch (Exception error)
            {
                await StopUnsafe();
                var detail = error is OperationCanceledException ? "Yêu cầu kết nối đã bị hủy" : error is TimeoutException ? "Quá thời gian tìm phòng LIVE" : error.Message;
                if (detail.Length > 240) detail = detail[..240];
                game.SetConnector(new("error", username, $"Chưa kết nối được @{username}: {detail}"));
                logger.LogWarning("TikTok connection to {Username} failed: {ErrorType}: {Detail}", username, error.GetType().Name, detail);
            }
            return game.Snapshot();
        }
        finally { lifecycle.Release(); }
    }

    public async Task<SessionSnapshot> DisconnectAsync()
    {
        await lifecycle.WaitAsync();
        try { await StopUnsafe(); game.SetConnector(new("idle", "", "Chưa kết nối TikTok")); return game.Snapshot(); }
        finally { lifecycle.Release(); }
    }

    private async Task StopUnsafe()
    {
        var previous = client;
        client = null;
        cancellation?.Cancel();
        if (previous is not null)
            try { await previous.Stop().WaitAsync(TimeSpan.FromSeconds(3)); }
            catch (Exception error) { logger.LogWarning("TikTok cleanup: {ErrorType}", error.GetType().Name); }
        cancellation?.Dispose(); cancellation = null;
    }

    public static string NormalizeUsername(string? value)
    {
        var username = value?.Trim().TrimStart('@') ?? "";
        if (!Regex.IsMatch(username, @"\A[A-Za-z0-9._]{2,24}\z"))
            throw new ArgumentException("Username TikTok cần 2–24 chữ, số, dấu chấm hoặc gạch dưới");
        return username;
    }

    public async ValueTask DisposeAsync() { await DisconnectAsync(); lifecycle.Dispose(); }
}

public static class TikTokEvents
{
    public static void Attach(TikTokLiveClient client, Action<IncomingEvent> receive)
    {
        client.OnChatMessage += (_, e) => { if (Basic(e, e.Sender, "chat") is { } input) receive(input with { Text = e.Message }); };
        client.OnJoin += (_, e) => { if (Basic(e, e.User, "join") is { } input) receive(input); };
        client.OnLike += (_, e) =>
        {
            if (e.Count is >= 1 and <= 10_000 && Basic(e, e.Sender, "like") is { } input)
                receive(input with { LikeCount = (int)e.Count });
        };
        client.OnGiftMessage += (_, e) =>
        {
            if (Basic(e, e.User, "gift") is not { } input || e.Gift is null) return;
            var count = e.RepeatCount > 0 ? e.RepeatCount : 1;
            if (count > 10_000) return;
            // RepeatCount is cumulative; Amount maps to ComboCount and can remain 1 throughout a streak.
            var id = e.Gift.Type == 1 && e.GroupId > 0
                ? $"tiktok:{e.RoomId}:gift:{input.ViewerId}:{e.GiftId}:{e.GroupId}" : input.EventId;
            receive(input with
            {
                EventId = id,
                GiftName = e.Gift.Name,
                DiamondCount = e.Gift.DiamondCost,
                RepeatCount = (int)count,
                GiftType = e.Gift.Type,
                RepeatEnd = e.StreakEnd
            });
        };
    }

    private static IncomingEvent? Basic(AMessageData message, User? user, string type)
    {
        // shortcut: ignore messages without a stable ID; add a provider-specific identity rule if its schema changes.
        if (message.MessageId <= 0 || user is null) return null;
        var id = user.Id > 0 ? user.Id.ToString(System.Globalization.CultureInfo.InvariantCulture) : user.UniqueId;
        if (string.IsNullOrWhiteSpace(id)) return null;
        var name = !string.IsNullOrWhiteSpace(user.NickName) ? user.NickName : !string.IsNullOrWhiteSpace(user.UniqueId) ? user.UniqueId : "Khách";
        return new($"tiktok:{message.RoomId}:{type}:{message.MessageId}", $"tiktok:{id}", name, type);
    }
}
