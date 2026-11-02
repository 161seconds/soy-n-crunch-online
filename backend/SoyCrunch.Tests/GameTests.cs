using SoyCrunch.Api.Game;
using Xunit;

namespace SoyCrunch.Tests;

public sealed class GameTests
{
    private readonly TestClock clock = new();
    private GameService Game() => new(clock);
    private static IncomingEvent Chat(string text = "!sua", string id = "alice") =>
        new(Guid.NewGuid().ToString("N"), id, "Alice", "chat", text);

    [Fact]
    public void CapacityIs24WithUniqueSeatsAndExistingGuestsCanStillChat()
    {
        var game = Game();
        for (var i = 0; i < 24; i++) game.Handle(Chat("xin chào", $"user-{i}"));
        Assert.Equal("full", game.Handle(Chat(id: "extra")).Outcome);
        Assert.Equal(24, game.Snapshot().Guests.Select(g => g.Seat).Distinct().Count());
        Assert.Equal("accepted", game.Handle(Chat("hello", "user-0")).Outcome);
    }

    [Theory]
    [InlineData("!sua", "milk")]
    [InlineData(" !SỮA ", "milk")]
    [InlineData("!banh", "rice-paper")]
    [InlineData("!bánh", "rice-paper")]
    public void ExactCommandsCreateTheCorrectOrder(string text, string item)
    {
        var game = Game(); game.Handle(Chat(text));
        Assert.Equal(item, Assert.Single(game.Snapshot().Orders).Item);
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
