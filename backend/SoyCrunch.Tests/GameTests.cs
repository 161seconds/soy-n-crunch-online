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
        Assert.Equal("accepted", game.Handle(gift with { RepeatEnd = true }).Outcome);
        Assert.Equal("duplicate", game.Handle(gift with { RepeatEnd = true }).Outcome);
        Assert.Equal(30, game.Snapshot().Stats.Diamonds);
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
        public void Advance(int seconds) => now = now.AddSeconds(seconds);
    }
}
