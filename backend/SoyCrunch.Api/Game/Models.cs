namespace SoyCrunch.Api.Game;

public sealed record IncomingEvent(string EventId, string ViewerId, string Name, string Type,
    string? Text = null, int LikeCount = 1, int DiamondCount = 1, int RepeatCount = 1,
    int GiftType = 0, bool RepeatEnd = true, string? GiftName = null, bool Demo = false);

public sealed record Guest(string Id, string Name, int Seat, bool Demo, long Diamonds,
    DateTimeOffset JoinedAt, DateTimeOffset LastSeenAt, string? Text = null,
    DateTimeOffset? TextUntil = null, string? Reaction = null, DateTimeOffset? ReactionAt = null);

public sealed record FoodOrder(string Id, string GuestId, string Item, string State,
    DateTimeOffset QueuedAt, DateTimeOffset? Until = null);
public sealed record FeedEntry(string Id, string Kind, string Text, DateTimeOffset At, string? Effect = null,
    int RepeatCount = 1, bool Demo = false);
public sealed record ShopSettings(string Title, bool AcceptingOrders = true);
public sealed record ConnectorState(string Status, string Username, string Message, DateTimeOffset? LastEventAt = null,
    int ChatEvents = 0, int LikeEvents = 0, int GiftEvents = 0, int JoinEvents = 0);
public sealed record SessionStats(int Served, long Likes, long Diamonds);
public sealed record SessionSnapshot(long Revision, DateTimeOffset StartedAt, DateTimeOffset ServerTime,
    ShopSettings Settings, Guest[] Guests, FoodOrder[] Orders, FeedEntry[] Feed,
    SessionStats Stats, bool DemoRunning, ConnectorState Connector, DateTimeOffset? KitchenBoostUntil = null);
public sealed record EventResult(string Outcome, string Message, SessionSnapshot Session);
public sealed record DemoRequest(bool Enabled);
public sealed record ConnectRequest(string Username);
