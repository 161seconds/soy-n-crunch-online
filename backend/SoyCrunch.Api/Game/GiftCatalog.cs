using System.Text.Json;

namespace SoyCrunch.Api.Game;

public sealed record GiftRule(string Effect, string Title, string Example, string[] Aliases,
    int PreviewPoints, string Description);

public static class GiftCatalog
{
    public static IReadOnlyList<GiftRule> Items { get; } = Array.AsReadOnly(
        JsonSerializer.Deserialize<GiftRule[]>(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "gifts.json")),
            JsonSerializerOptions.Web) ?? throw new InvalidOperationException("Gift catalog is missing"));

    public static string Effect(string? name, long points)
    {
        var normalized = MenuCatalog.Normalize(name ?? "");
        // shortcut: match curated whole names; add regional aliases when real gifts arrive under another name.
        return Items.FirstOrDefault(rule => rule.Aliases.Any(alias => MenuCatalog.Normalize(alias) == normalized))?.Effect
            ?? (points >= 100 ? "festival" : points >= 10 ? "fireworks" : "hearts");
    }
}
