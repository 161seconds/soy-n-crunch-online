using ProtoBuf;
using SoyCrunch.Api;
using SoyCrunch.Api.Game;
using TikTokLiveSharp.Client;
using TikTokLiveSharp.Client.Config;
using Xunit;

namespace SoyCrunch.Tests;

public sealed class TikTokTests
{
    [Theory]
    [InlineData("!sua", "milk")]
    [InlineData("sữa đậu xanh", "mung-bean")]
    [InlineData("banh trang nuong", "rice-paper")]
    public void ActualConnectorDecodesProtobufChatAndLikeIntoTheGame(string text, string item)
    {
        var game = new GameService(TimeProvider.System);
        var client = new FixtureClient();
        TikTokEvents.Attach(client, input => game.Handle(input));
        client.Push("WebcastChatMessage", new ChatWire { Header = new() { Id = 100 }, User = new(), Text = text });
        client.Push("WebcastLikeMessage", new LikeWire { Header = new() { Id = 101 }, User = new(), Count = 7 });
        var guest = Assert.Single(game.Snapshot().Guests);
        Assert.Equal("tiktok:12345", guest.Id);
        Assert.Equal("Khách fixture", guest.Name);
        Assert.Equal(item, Assert.Single(game.Snapshot().Orders).Item);
        Assert.Equal(7, game.Snapshot().Stats.Likes);
    }

    [Fact]
    public void ProtobufGiftUsesCumulativeRepeatCountAndDeduplicatesTheGroup()
    {
        var game = new GameService(TimeProvider.System);
        var client = new FixtureClient();
        var normalized = new List<IncomingEvent>();
        TikTokEvents.Attach(client, input => { normalized.Add(input); game.Handle(input); });
        client.Push("WebcastGiftMessage", new GiftWire { Header = new() { Id = 200 }, RepeatCount = 2, RepeatEnd = 0 });
        Assert.Equal(0, game.Snapshot().Stats.Diamonds);
        client.Push("WebcastGiftMessage", new GiftWire { Header = new() { Id = 201 }, RepeatCount = 3, RepeatEnd = 1 });
        client.Push("WebcastGiftMessage", new GiftWire { Header = new() { Id = 202 }, RepeatCount = 3, RepeatEnd = 1 });
        Assert.Equal(30, game.Snapshot().Stats.Diamonds);
        Assert.Equal(3, normalized.Last().RepeatCount);
        Assert.Equal(normalized[1].EventId, normalized[2].EventId);
        Assert.Equal("Hoa hồng", normalized.Last().GiftName);
    }

    [Fact]
    public void MessagesWithoutStableIdsAreIgnored()
    {
        var client = new FixtureClient(); var received = new List<IncomingEvent>();
        TikTokEvents.Attach(client, received.Add);
        client.Push("WebcastChatMessage", new ChatWire { Header = new() { Id = 0 }, User = new(), Text = "!sua" });
        Assert.Empty(received);
    }

    [Theory]
    [InlineData("")]
    [InlineData("https://example.com")]
    [InlineData("../username")]
    [InlineData("user name")]
    public void InvalidUsernamesCannotBecomeRemoteUrls(string value) =>
        Assert.Throws<ArgumentException>(() => TikTokConnector.NormalizeUsername(value));

    [Fact]
    public void UsernameAcceptsTheAtPrefix() => Assert.Equal("one61secondz", TikTokConnector.NormalizeUsername(" @one61secondz "));

    private sealed class FixtureClient : TikTokLiveClient
    {
        public FixtureClient() : base("fixture-only", settings: Settings()) { }
        private static ClientSettings Settings()
        {
            var settings = Constants.DEFAULT_SETTINGS;
            settings.PrintToConsole = false; settings.CheckForUnparsedData = false;
            return settings;
        }
        public void Push<T>(string method, T payload)
        {
            var envelope = new ResponseWire { Messages = [new() { Method = method, Payload = Encode(payload) }] };
            using var stream = new MemoryStream(Encode(envelope));
            HandleMessages(Serializer.Deserialize<TikTokLiveSharp.Models.Protobuf.Messages.Response>(stream));
        }
        private static byte[] Encode<T>(T value) { using var stream = new MemoryStream(); Serializer.Serialize(stream, value); return stream.ToArray(); }
    }

    // Minimal wire fixtures exercise the published library's decoder, not a mocked event callback.
    [ProtoContract] private sealed class ResponseWire { [ProtoMember(1)] public List<MessageWire> Messages { get; set; } = []; }
    [ProtoContract]
    private sealed class MessageWire
    {
        [ProtoMember(1)] public string Method { get; set; } = "";
        [ProtoMember(2)] public byte[] Payload { get; set; } = [];
    }
    [ProtoContract]
    private sealed class HeaderWire
    {
        [ProtoMember(2)] public long Id { get; set; }
        [ProtoMember(3)] public long Room { get; set; } = 999;
    }
    [ProtoContract]
    private sealed class UserWire
    {
        [ProtoMember(1)] public long Id { get; set; } = 12345;
        [ProtoMember(3)] public string Name { get; set; } = "Khách fixture";
    }
    [ProtoContract]
    private sealed class ChatWire
    {
        [ProtoMember(1)] public HeaderWire Header { get; set; } = new();
        [ProtoMember(2)] public UserWire User { get; set; } = new();
        [ProtoMember(3)] public string Text { get; set; } = "";
    }
    [ProtoContract]
    private sealed class LikeWire
    {
        [ProtoMember(1)] public HeaderWire Header { get; set; } = new();
        [ProtoMember(2)] public long Count { get; set; }
        [ProtoMember(5)] public UserWire User { get; set; } = new();
    }
    [ProtoContract]
    private sealed class GiftInfoWire
    {
        [ProtoMember(5)] public long Id { get; set; } = 5655;
        [ProtoMember(11)] public int Type { get; set; } = 1;
        [ProtoMember(12)] public int Diamonds { get; set; } = 10;
        [ProtoMember(16)] public string Name { get; set; } = "Hoa hồng";
    }
    [ProtoContract]
    private sealed class GiftWire
    {
        [ProtoMember(1)] public HeaderWire Header { get; set; } = new();
        [ProtoMember(2)] public long GiftId { get; set; } = 5655;
        [ProtoMember(5)] public long RepeatCount { get; set; }
        [ProtoMember(6)] public long ComboCount { get; set; } = 1;
        [ProtoMember(7)] public UserWire User { get; set; } = new();
        [ProtoMember(9)] public int RepeatEnd { get; set; }
        [ProtoMember(11)] public long Group { get; set; } = 888;
        [ProtoMember(15)] public GiftInfoWire Gift { get; set; } = new();
    }
}
