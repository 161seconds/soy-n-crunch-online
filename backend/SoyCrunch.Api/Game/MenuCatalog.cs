using System.Globalization;
using System.Text;
using System.Text.Json;

namespace SoyCrunch.Api.Game;

public sealed record MenuItem(string Id, string Name, string Category, string Command,
    string[] Aliases, int PrepSeconds, string Visual, string Color);

public static class MenuCatalog
{
    public static IReadOnlyList<MenuItem> Items { get; } = Array.AsReadOnly(
        JsonSerializer.Deserialize<MenuItem[]>(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "menu.json")),
            JsonSerializerOptions.Web) ?? throw new InvalidOperationException("Menu is missing"));

    public static MenuItem? Match(string text)
    {
        var name = Normalize(text);
        return Items.FirstOrDefault(item => Normalize(item.Name) == name
            || Normalize(item.Command) == name || item.Aliases.Any(alias => Normalize(alias) == name));
    }

    private static string Normalize(string text)
    {
        text = text.Trim();
        if (text.StartsWith('!')) text = text[1..];
        return new string(text.ToLowerInvariant().Normalize(NormalizationForm.FormD)
            .Where(c => !char.IsWhiteSpace(c) && CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            .ToArray()).Replace('đ', 'd');
    }

    public static MenuItem Get(string id) => Items.First(item => item.Id == id);
}
