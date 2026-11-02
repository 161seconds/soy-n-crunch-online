using Microsoft.AspNetCore.Http.Json;
using SoyCrunch.Api;
using SoyCrunch.Api.Game;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://127.0.0.1:5186");
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 64 * 1024);
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<GameService>();
builder.Services.AddSingleton<TikTokConnector>();
builder.Services.AddSignalR(options => options.MaximumReceiveMessageSize = 64 * 1024);
builder.Services.AddHostedService<GameWorker>();
builder.Services.Configure<JsonOptions>(options => options.SerializerOptions.PropertyNameCaseInsensitive = true);
var app = builder.Build();

app.Use(async (context, next) =>
{
    var host = context.Request.Host.Host;
    if (host is not ("127.0.0.1" or "localhost" or "[::1]" or "::1"))
    { context.Response.StatusCode = 421; return; }
    if (context.Request.Headers.TryGetValue("Origin", out var origin)
        && (!Uri.TryCreate(origin.ToString(), UriKind.Absolute, out var uri) || !uri.IsLoopback
            || uri.Scheme != "http" || uri.Port is not (5186 or 5176)))
    { context.Response.StatusCode = 403; return; }
    if (context.Request.Path.StartsWithSegments("/api") && context.Request.Method == "POST"
        && !context.Request.HasJsonContentType())
    { context.Response.StatusCode = 415; return; }
    context.Response.Headers.XContentTypeOptions = "nosniff";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    try { await next(); }
    catch (ArgumentException error)
    { await Results.BadRequest(new { message = error.Message }).ExecuteAsync(context); }
});

if (Directory.Exists(app.Environment.WebRootPath))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
    app.MapFallbackToFile("index.html");
}
app.MapGet("/api/health", () => new { status = "ok", application = "Soy & Crunch" });
app.MapGet("/api/session", (GameService game) => game.Snapshot());
app.MapPost("/api/events", (IncomingEvent input, GameService game) => game.Handle(input));
app.MapPost("/api/session/settings", (ShopSettings input, GameService game) => game.UpdateSettings(input));
app.MapPost("/api/session/reset", (GameService game) => game.Reset());
app.MapPost("/api/demo", (DemoRequest input, GameService game) => game.SetDemo(input.Enabled));
app.MapPost("/api/tiktok/connect", (ConnectRequest input, TikTokConnector connector, CancellationToken token) => connector.ConnectAsync(input.Username, token));
app.MapPost("/api/tiktok/disconnect", (TikTokConnector connector) => connector.DisconnectAsync());
app.MapHub<LiveHub>("/hubs/live");
app.Run();

public partial class Program;
