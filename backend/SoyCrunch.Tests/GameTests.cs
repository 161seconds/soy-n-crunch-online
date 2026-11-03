using SoyCrunch.Api.Game;
using System.Text;
using Xunit;

namespace SoyCrunch.Tests;

public sealed class GameTests
{
    private readonly TestClock clock = new();
    private GameService Game() => new(clock);
    private static IncomingEvent Chat(string text = "!sua", string id = "alice") =>
        new(Guid.NewGuid().ToString("N"), id, "Alice", "chat", text);

    [Fact]
    public void CapacityIs49WithUniqueSeatsAndExistingGuestsCanStillChatAndOrder()
    {
        var game = Game();
        for (var i = 0; i < 49; i++)
            Assert.Equal("accepted", game.Handle(Chat("xin chào", $"user-{i}")).Outcome);
        var overflow = game.Handle(Chat(id: "extra"));
        Assert.Equal("full", overflow.Outcome);
        Assert.Contains("49", overflow.Message);
        Assert.Equal(Enumerable.Range(0, 49), game.Snapshot().Guests.Select(g => g.Seat));
        Assert.Equal("accepted", game.Handle(Chat("hello", "user-0")).Outcome);
        Assert.Equal("accepted", game.Handle(Chat(id: "user-48")).Outcome);
        Assert.Equal("user-48", Assert.Single(game.Snapshot().Orders).GuestId);
    }

    public static IEnumerable<object[]> MenuCommands() => MenuCatalog.Items.SelectMany(item =>
        item.Aliases.Prepend(item.Command).Prepend(item.Name)
            .SelectMany(text => new[] { text, text.TrimStart('!') }).Distinct()
            .Select(text => new object[] { text, item.Id }));
    public static IEnumerable<object[]> MenuItems() => MenuCatalog.Items.Select(item => new object[] { item.Id });

    [Theory]
    [MemberData(nameof(MenuCommands))]
    public void DishNamesAndCommandsCreateTheCorrectOrder(string text, string item)
    {
        var game = Game(); game.Handle(Chat($" {text.ToUpperInvariant().Normalize(NormalizationForm.FormD)} "));
        Assert.Equal(item, Assert.Single(game.Snapshot().Orders).Item);
    }

    [Theory]
    [InlineData("sua dau nanh", "milk")]
    [InlineData("đậu xanh", "mung-bean")]
    [InlineData("sua dau xanh", "mung-bean")]
    [InlineData("sữa \t đậu\n xanh", "mung-bean")]
    [InlineData("panna cotta", "panna-passion")]
    [InlineData("pana cotta", "panna-passion")]
    [InlineData("yogurt da", "iced-yogurt")]
    [InlineData("sữa chua đá", "iced-yogurt")]
    [InlineData("banh trang nuong", "rice-paper")]
    [InlineData("!SỮA ĐẬU XANH", "mung-bean")]
    public void VietnameseNamesAcceptAccentsSpacingAndOptionalBang(string text, string item)
    {
        var game = Game(); game.Handle(Chat(text));
        Assert.Equal(item, Assert.Single(game.Snapshot().Orders).Item);
    }

    [Fact]
    public void MenuContains28DistinctItemsWithoutTofuOrAmbiguousCommands()
    {
        Assert.Equal(28, MenuCatalog.Items.Count);
        Assert.Equal(28, MenuCatalog.Items.Select(item => item.Id).Distinct().Count());
        var commands = MenuCatalog.Items.SelectMany(item => item.Aliases.Prepend(item.Command)).ToArray();
        Assert.Equal(commands.Length, commands.Distinct(StringComparer.OrdinalIgnoreCase).Count());
        Assert.DoesNotContain(MenuCatalog.Items, item => item.Name.Contains("tàu hủ", StringComparison.OrdinalIgnoreCase));
    }

    [Theory]
    [InlineData("!tauhu")]
    [InlineData("!tàu hủ")]
    [InlineData("muốn gọi !dauxanh")]
    [InlineData("!panna thêm đá")]
    [InlineData("tàu hủ")]
    [InlineData("mình thích sữa đậu xanh")]
    [InlineData("panna cotta thêm đá")]
    [InlineData("sữa đậu xanh và bánh tráng nướng")]
    [InlineData("!!sua")]
    [InlineData("!")]
    [InlineData("")]
    public void RemovedItemsAndPartialCommandsNeverCreateOrders(string text)
    {
        var game = Game(); game.Handle(Chat(text));
        Assert.Empty(game.Snapshot().Orders);
    }

    [Theory]
    [MemberData(nameof(MenuItems))]
    public void EveryMenuItemCompletesItsOwnPreparationAndConsumption(string id)
    {
        var item = MenuCatalog.Get(id);
        var game = Game(); game.Handle(Chat(item.Name));
        game.Tick();
        clock.Advance(item.PrepSeconds - 1);
        Assert.Equal("cooking", Assert.Single(game.Tick().Orders).State);
        clock.Advance(1);
        Assert.Equal("serving", Assert.Single(game.Tick().Orders).State);
        clock.Advance(1);
        Assert.Equal("consuming", Assert.Single(game.Tick().Orders).State);
        clock.Advance(6);
        var state = game.Tick();
        Assert.Empty(state.Orders);
        Assert.Equal(1, state.Stats.Served);
        Assert.Contains(state.Feed, entry => entry.Kind == "served" && entry.Text.Contains(item.Name));
    }

    [Fact]
    public void NormalConversationDoesNotCreateAnOrder()
    {
        var game = Game(); game.Handle(Chat("cho hỏi !sua là gì"));
        Assert.Empty(game.Snapshot().Orders);
    }

    [Fact]
    public void EventReplayAndBusyOrdersDoNotCreateExtraOrders()
    {
        var game = Game(); var input = Chat();
        game.Handle(input);
        Assert.Equal("duplicate", game.Handle(input).Outcome);
        Assert.Equal("busy", game.Handle(Chat("!banh")).Outcome);
        Assert.Single(game.Snapshot().Orders);
    }

    [Fact]
    public void GiftStreakCountsOnlyTheFinalEventAndDeduplicatesIt()
    {
        var game = Game();
        var gift = new IncomingEvent("streak", "alice", "Alice", "gift", DiamondCount: 10, RepeatCount: 3, GiftType: 1, RepeatEnd: false);
        Assert.Equal("ignored", game.Handle(gift).Outcome);
        Assert.Equal(0, game.Snapshot().Stats.Diamonds);
        Assert.DoesNotContain(game.Snapshot().Feed, entry => entry.Kind == "gift");
        Assert.Equal("accepted", game.Handle(gift with { RepeatEnd = true }).Outcome);
        Assert.Equal("duplicate", game.Handle(gift with { RepeatEnd = true }).Outcome);
        Assert.Equal(30, game.Snapshot().Stats.Diamonds);
        Assert.Equal("fireworks", Assert.Single(game.Snapshot().Feed, entry => entry.Kind == "gift").Effect);
    }

    [Theory]
    [InlineData(0, 1, "hearts")]
    [InlineData(9, 1, "hearts")]
    [InlineData(1, 10, "fireworks")]
    [InlineData(10, 1, "fireworks")]
    [InlineData(99, 1, "fireworks")]
    [InlineData(25, 4, "festival")]
    [InlineData(100, 1, "festival")]
    [InlineData(50_000, 10_000, "festival")]
    public void GiftEffectsUseTheTotalComboValue(int value, int repeat, string effect)
    {
        var game = Game();
        var result = game.Handle(new("gift", "alice", "Alice", "gift", DiamondCount: value, RepeatCount: repeat));
        Assert.Equal("accepted", result.Outcome);
        Assert.Equal((long)value * repeat, result.Session.Stats.Diamonds);
        Assert.Equal(effect, Assert.Single(result.Session.Feed, entry => entry.Kind == "gift").Effect);
        Assert.Equal(effect == "festival" ? 2 : 0, result.Session.Guests.Count(g => g.Demo));
    }

    [Fact]
    public void CompletedGiftComboSpeedsUpCookingAndInvitesGuestsOnlyOnce()
    {
        var game = Game(); game.Handle(Chat("!banh")); game.Tick(); clock.Advance(1);
        var gift = new IncomingEvent("combo", "alice", "Alice", "gift", DiamondCount: 10, RepeatCount: 10, GiftType: 1, RepeatEnd: false);
        var original = Assert.Single(game.Snapshot().Orders).Until;
        Assert.Equal("ignored", game.Handle(gift).Outcome);
        Assert.Equal(original, Assert.Single(game.Snapshot().Orders).Until);
        Assert.Single(game.Snapshot().Guests);
        game.Handle(gift with { RepeatEnd = true });
        var deadline = clock.GetUtcNow().AddSeconds(1.5);
        Assert.Equal(deadline, Assert.Single(game.Snapshot().Orders).Until);
        Assert.Equal(2, game.Snapshot().Guests.Count(g => g.Demo));
        Assert.Equal("duplicate", game.Handle(gift with { RepeatEnd = true }).Outcome);
        Assert.Equal(deadline, Assert.Single(game.Snapshot().Orders).Until);
        Assert.Equal(2, game.Snapshot().Guests.Count(g => g.Demo));
        clock.Advance(1); Assert.Equal("cooking", Assert.Single(game.Tick().Orders).State);
        clock.Advance(1); Assert.Equal("serving", Assert.Single(game.Tick().Orders).State);
    }

    [Fact]
    public void SmallOrLateGiftsDoNotChangeCookingDeadlines()
    {
        var game = Game(); game.Handle(Chat("!banh")); game.Tick();
        var deadline = Assert.Single(game.Snapshot().Orders).Until;
        game.Handle(new("small", "alice", "Alice", "gift", DiamondCount: 9));
        Assert.Equal(deadline, Assert.Single(game.Snapshot().Orders).Until);
        clock.Advance(5);
        game.Handle(new("late", "alice", "Alice", "gift", DiamondCount: 10));
        Assert.Equal(deadline, Assert.Single(game.Snapshot().Orders).Until);
    }

    [Fact]
    public void FestivalGuestsRespectCapacityAndNeverDisplaceRealGuests()
    {
        var game = Game();
        for (var i = 0; i < 48; i++) game.Handle(Chat("hello", $"user-{i}"));
        game.Handle(new("festival", "user-0", "Alice", "gift", DiamondCount: 100));
        Assert.Equal(49, game.Snapshot().Guests.Length);
        Assert.Equal(48, game.Snapshot().Guests.Count(g => !g.Demo));
        Assert.Single(game.Snapshot().Guests, g => g.Demo);
        var result = game.Handle(new("outside", "no-seat", "Bob", "gift", DiamondCount: 100));
        Assert.Equal("accepted", result.Outcome);
        Assert.Equal(49, result.Session.Guests.Length);
        Assert.DoesNotContain(result.Session.Guests, g => g.Id == "no-seat");
        Assert.Equal("festival", result.Session.Feed.Last().Effect);
        Assert.Equal(200, result.Session.Stats.Diamonds);
    }

    [Theory]
    [InlineData("  HOA  HỒNG ", "flowers")]
    [InlineData("Rose", "flowers")]
    [InlineData("ICE CREAM", "treat")]
    [InlineData("ca phe", "treat")]
    [InlineData("GG", "rush")]
    [InlineData("thien nga", "swan")]
    [InlineData("Music Note", "dance")]
    [InlineData("sao bang", "stars")]
    [InlineData("Rose Garden", "hearts")]
    [InlineData("mystery", "hearts")]
    public void GiftNamesMatchWholeAliasesWithTheMenuNormalization(string name, string effect)
    {
        var game = Game();
        var result = game.Handle(new("theme", "alice", "Alice", "gift",
            GiftName: name.Normalize(NormalizationForm.FormD), RepeatCount: 2, Demo: true));
        var entry = Assert.Single(result.Session.Feed, e => e.Kind == "gift");
        Assert.Equal(effect, entry.Effect);
        Assert.Equal(2, entry.RepeatCount);
        Assert.True(entry.Demo);
    }

    [Theory]
    [InlineData("Rose", "flowers")]
    [InlineData("Ice Cream", "treat")]
    [InlineData("GG", "rush")]
    [InlineData("Swan", "swan")]
    [InlineData("Music Note", "dance")]
    [InlineData("Galaxy", "stars")]
    public void NamedGiftsKeepTheirThemeAndValueRewardsWithoutDoublingInvitations(string name, string effect)
    {
        var game = Game();
        var result = game.Handle(new("theme", "alice", "Alice", "gift", GiftName: name, DiamondCount: 100));
        Assert.Equal(effect, Assert.Single(result.Session.Feed, e => e.Kind == "gift").Effect);
        Assert.Equal(100, result.Session.Stats.Diamonds);
        Assert.Equal(2, result.Session.Guests.Count(g => g.Demo));
        Assert.Equal(clock.GetUtcNow().AddSeconds(20), result.Session.KitchenBoostUntil);
    }

    [Fact]
    public void TreatsUseTheNormalKitchenAndRespectBusyClosedAndFullGuards()
    {
        var game = Game();
        var gift = new IncomingEvent("treat", "alice", "Alice", "gift", GiftName: "Ice Cream");
        game.Handle(gift);
        Assert.Equal("iced-yogurt", Assert.Single(game.Snapshot().Orders).Item);
        Assert.Equal(0, game.Snapshot().Stats.Served);
        Assert.Equal("duplicate", game.Handle(gift).Outcome);
        game.Handle(gift with { EventId = "busy" });
        Assert.Single(game.Snapshot().Orders);
        Assert.Contains("đang có một món", game.Snapshot().Feed.Last().Text);
        game.UpdateSettings(new("Quán", false));
        game.Handle(gift with { EventId = "closed", ViewerId = "bob" });
        Assert.Single(game.Snapshot().Orders);
        Assert.Contains("ngưng nhận món", game.Snapshot().Feed.Last().Text);

        game = Game();
        for (var i = 0; i < 49; i++) game.Handle(Chat("hello", $"guest-{i}"));
        game.Handle(gift);
        Assert.Equal(49, game.Snapshot().Guests.Length);
        Assert.Empty(game.Snapshot().Orders);
        Assert.Contains("Quán đầy", game.Snapshot().Feed.Last().Text);
    }

    [Fact]
    public void ABoostedDessertStillCannotBypassTheEightSecondCooldown()
    {
        var game = Game();
        game.Handle(new("rush", "alice", "Alice", "gift", GiftName: "GG"));
        game.Handle(Chat("yogurt đá")); game.Tick();
        clock.Advance(0.5); game.Tick();
        clock.Advance(1); game.Tick();
        clock.Advance(6); game.Tick();
        Assert.Equal(1, game.Snapshot().Stats.Served);
        var gift = new IncomingEvent("early", "alice", "Alice", "gift", GiftName: "Kem");
        game.Handle(gift);
        Assert.Empty(game.Snapshot().Orders);
        Assert.Contains("8 giây", game.Snapshot().Feed.Last().Text);
        clock.Advance(0.5);
        game.Handle(gift with { EventId = "ready" });
        Assert.Single(game.Snapshot().Orders);
    }

    [Fact]
    public void RushSpeedsUpCurrentAndQueuedCookingThenExpires()
    {
        var game = Game(); game.Handle(Chat("!banh")); game.Tick(); clock.Advance(1);
        game.Handle(new("rush", "alice", "Alice", "gift", GiftName: "GG"));
        Assert.Equal(clock.GetUtcNow().AddSeconds(1.5), Assert.Single(game.Snapshot().Orders).Until);
        game.Handle(Chat("!banh", "bob"));
        clock.Advance(1.5); game.Tick();
        Assert.Equal(clock.GetUtcNow().AddSeconds(2), game.Snapshot().Orders.Single(o => o.GuestId == "bob").Until);
        clock.Advance(19); game.Tick();
        Assert.Null(game.Snapshot().KitchenBoostUntil);
        game.Handle(Chat("!sua", "charlie")); game.Tick();
        Assert.Equal(clock.GetUtcNow().AddSeconds(2), game.Snapshot().Orders.Single(o => o.GuestId == "charlie").Until);
    }

    [Fact]
    public void RushRefreshesWithoutStackingAndResetClearsIt()
    {
        var game = Game();
        var gift = new IncomingEvent("rush", "alice", "Alice", "gift", GiftName: "Fire");
        game.Handle(gift); clock.Advance(5);
        game.Handle(gift with { EventId = "refresh" });
        Assert.Equal(clock.GetUtcNow().AddSeconds(20), game.Snapshot().KitchenBoostUntil);
        clock.Advance(5);
        game.Handle(gift with { EventId = "refresh" });
        Assert.Equal(clock.GetUtcNow().AddSeconds(15), game.Snapshot().KitchenBoostUntil);
        Assert.Null(game.Reset().KitchenBoostUntil);
        Assert.Equal(0, game.Snapshot().Stats.Diamonds);
    }

    [Fact]
    public void CommunityGoalsCountCumulativePointsAndNeverRepeatForAReplayOrEachCrossedGoal()
    {
        var game = Game();
        game.Handle(new("before", "alice", "Alice", "gift", DiamondCount: 99));
        Assert.Null(game.Snapshot().KitchenBoostUntil);
        var rose = new IncomingEvent("rose", "alice", "Alice", "gift", GiftName: "Rose");
        game.Handle(rose);
        Assert.Single(game.Snapshot().Feed, e => e.Kind == "milestone");
        Assert.Equal("flowers", game.Snapshot().Feed.Last().Effect);
        var until = game.Snapshot().KitchenBoostUntil;
        clock.Advance(1); game.Handle(rose);
        Assert.Equal(100, game.Snapshot().Stats.Diamonds);
        Assert.Equal(until, game.Snapshot().KitchenBoostUntil);
        Assert.Single(game.Snapshot().Feed, e => e.Kind == "milestone");

        game.Reset();
        game.Handle(rose with { RepeatCount = 350 });
        Assert.Equal(350, game.Snapshot().Stats.Diamonds);
        Assert.Single(game.Snapshot().Feed, e => e.Kind == "milestone");
        Assert.Contains("300 điểm", game.Snapshot().Feed.Single(e => e.Kind == "milestone").Text);
    }

    [Fact]
    public void CookingIsSerialButGuestsCanConsumeTogether()
    {
        var game = Game(); game.Handle(Chat()); game.Handle(Chat("!banh", "bob"));
        game.Tick(); Assert.Single(game.Snapshot().Orders, o => o.State == "cooking");
        clock.Advance(2); game.Tick();
        Assert.Contains(game.Snapshot().Orders, o => o.Item == "milk" && o.State == "serving");
        Assert.Contains(game.Snapshot().Orders, o => o.Item == "rice-paper" && o.State == "cooking");
        clock.Advance(1); game.Tick();
        Assert.Contains(game.Snapshot().Orders, o => o.Item == "milk" && o.State == "consuming");
        clock.Advance(6); game.Tick();
        Assert.Equal(1, game.Snapshot().Stats.Served);
    }

    [Fact]
    public void ClosingStopsOrdersButNotChatOrTheExistingKitchen()
    {
        var game = Game(); game.Handle(Chat());
        game.UpdateSettings(new("Quán", false));
        Assert.Equal("closed", game.Handle(Chat("!banh", "bob")).Outcome);
        Assert.Equal("accepted", game.Handle(Chat("chào", "charlie")).Outcome);
        Assert.Equal("cooking", Assert.Single(game.Tick().Orders).State);
    }

    [Fact]
    public void LikesDoNotCreateGuestsAndInvalidCountsNeverMutateState()
    {
        var game = Game();
        game.Handle(new("like", "alice", "Alice", "like", LikeCount: 5));
        Assert.Empty(game.Snapshot().Guests); Assert.Equal(5, game.Snapshot().Stats.Likes);
        Assert.Throws<ArgumentException>(() => game.Handle(new("invalid", "x", "X", "gift", RepeatCount: -1)));
        Assert.Equal(0, game.Snapshot().Stats.Diamonds);
    }

    [Fact]
    public void InactiveSeatsExpireButActiveOrdersKeepTheirGuest()
    {
        var game = Game(); game.Handle(Chat("hello", "idle")); game.Handle(Chat(id: "eating"));
        clock.Advance(121); game.Tick();
        Assert.Equal("eating", Assert.Single(game.Snapshot().Guests).Id);
    }

    [Fact]
    public void ResetClearsTheSessionAndKeepsRevisionIncreasing()
    {
        var game = Game(); game.SetDemo(true); game.Handle(Chat());
        var previous = game.Snapshot().Revision; var state = game.Reset();
        Assert.Empty(state.Guests); Assert.Empty(state.Orders); Assert.False(state.DemoRunning);
        Assert.Equal(0, state.Stats.Served); Assert.True(state.Revision > previous);
    }

    [Fact]
    public void ConnectorEvidenceSurvivesStatusChangesAndExcludesDemoEvents()
    {
        var game = Game(); game.SetDemo(true); game.Tick();
        Assert.Equal(0, game.Snapshot().Connector.ChatEvents);
        game.ConnectorEventReceived("chat"); game.ConnectorEventReceived("gift");
        game.SetConnectorStatus("disconnected", "Connection closed");
        var state = game.Snapshot().Connector;
        Assert.Equal(1, state.ChatEvents); Assert.Equal(1, state.GiftEvents);
        Assert.Equal(0, state.LikeEvents); Assert.NotNull(state.LastEventAt);
    }

    private sealed class TestClock : TimeProvider
    {
        private DateTimeOffset now = new(2026, 11, 2, 0, 0, 0, TimeSpan.Zero);
        public override DateTimeOffset GetUtcNow() => now;
        public void Advance(double seconds) => now = now.AddSeconds(seconds);
    }
}
