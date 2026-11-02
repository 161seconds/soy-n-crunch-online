using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using SoyCrunch.Api.Game;
using Xunit;

namespace SoyCrunch.Tests;

public sealed class ApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client;
    public ApiTests(WebApplicationFactory<Program> app) => client = app.CreateClient(new() { BaseAddress = new("http://localhost:5186") });

    [Fact]
    public async Task ApiProcessesAnEventAndReturnsASnapshot()
    {
        var response = await client.PostAsJsonAsync("/api/events", new IncomingEvent(Guid.NewGuid().ToString("N"), "api-alice", "Alice", "chat", "!sua"));
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<EventResult>();
        Assert.Equal("accepted", result!.Outcome);
        Assert.Contains(result.Session.Orders, o => o.GuestId == "api-alice");
    }

    [Fact]
    public async Task MalformedInputReturns400()
    {
        var response = await client.PostAsJsonAsync("/api/events", new { type = "chat" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ConnectorRejectsUrlsAndDisconnectReturnsAnIdleSnapshot()
    {
        var invalid = await client.PostAsJsonAsync("/api/tiktok/connect", new { username = "https://example.com" });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        var disconnected = await client.PostAsJsonAsync("/api/tiktok/disconnect", new { });
        disconnected.EnsureSuccessStatusCode();
        Assert.Equal("idle", (await disconnected.Content.ReadFromJsonAsync<SessionSnapshot>())!.Connector.Status);
    }

    [Fact]
    public async Task ForeignOriginIsRejected()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/events") { Content = JsonContent.Create(new { }) };
        request.Headers.Add("Origin", "https://example.com");
        Assert.Equal(HttpStatusCode.Forbidden, (await client.SendAsync(request)).StatusCode);
    }

    [Fact]
    public async Task NonJsonMutationAndForeignHostAreRejected()
    {
        Assert.Equal(HttpStatusCode.UnsupportedMediaType, (await client.PostAsync("/api/session/reset", new StringContent(""))).StatusCode);
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/health"); request.Headers.Host = "attacker.example:5186";
        Assert.Equal(421, (int)(await client.SendAsync(request)).StatusCode);
    }
}
