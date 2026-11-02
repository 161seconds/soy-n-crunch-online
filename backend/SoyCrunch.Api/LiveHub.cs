using Microsoft.AspNetCore.SignalR;
using SoyCrunch.Api.Game;

namespace SoyCrunch.Api;

public sealed class LiveHub(GameService game) : Hub
{
    public override async Task OnConnectedAsync()
    {
        await Clients.Caller.SendAsync("session", game.Snapshot());
        await base.OnConnectedAsync();
    }
}

public sealed class GameWorker(GameService game, IHubContext<LiveHub> hub) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(250));
        long published = -1;
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            var state = game.Tick();
            if (state.Revision == published) continue;
            await hub.Clients.All.SendAsync("session", state, stoppingToken);
            published = state.Revision;
        }
    }
}
