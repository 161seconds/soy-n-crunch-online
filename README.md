# Soy & Crunch

An interactive virtual soy milk and grilled rice paper shop for TikTok LIVE. Built with ASP.NET Core .NET 10, SignalR, React, TypeScript, and Canvas 2D.

## Scope

One local streaming PC, one live session, 24 seats, two menu items, simulated viewer events, and a portrait overlay. Session state lives in memory. Restarting the backend or resetting the session clears it. This is an entertainment overlay, not a food ordering or payment system.

## Documentation

- [Product and gameplay](docs/01-product.md)
- [Architecture and event contracts](docs/02-architecture.md)
- [Art and audio](docs/03-art-audio.md)
- [Implementation and verification](docs/04-implementation.md)
- [TikTok connector verification](docs/05-connector-verification.md)
- [Validation results and remaining checks](docs/06-validation.md)

## Run locally

Requirements: .NET 10 SDK, Node.js 22.12+ and npm. Node is used for frontend development/build tooling, not the backend connector.

```powershell
dotnet restore backend/SoyCrunch.slnx
npm --prefix frontend ci
```

Run these in two terminals from the repository root:

```powershell
dotnet run --project backend/SoyCrunch.Api --no-launch-profile
```

```powershell
npm --prefix frontend run dev
```

- Control panel: <http://127.0.0.1:5176/>
- Portrait overlay: <http://127.0.0.1:5176/overlay>
- API health: <http://127.0.0.1:5186/api/health>
- SignalR: `/hubs/live`, proxied by Vite during development.

Click **Mời 12 khách** to simulate activity. Enter a guest name and click either menu item; each guest may have one active order. `!sua` / `!sữa` orders soy milk; `!banh` / `!bánh` orders grilled rice paper. **Dừng bot** stops new bot events; existing simulated guests remain until reset or idle expiry.

All simulated guests are marked as such. Enter a public TikTok username and click **Kết nối** after starting a LIVE. The initial C# connector verification returned `LiveNotFoundException` for `@one61secondz`; actual live events remain unverified. A failed connection never enables a fake “connected” state.

## Validate

```powershell
dotnet test backend/SoyCrunch.slnx
npm --prefix frontend test
npm --prefix frontend run build
```

With the API running and a disposable session:

```powershell
npm --prefix frontend run test:integration
npm --prefix frontend run test:connector -- one61secondz
```

The integration smoke test clears its test session and refuses to run while real guests or a connected TikTok source are present. The connector check reads public events only; it does not post comments, send gifts, or require account credentials. See the verification report for the difference between connecting and observing all event types.

## Publish a single local server

Build and copy the frontend before publishing ASP.NET Core:

```powershell
npm --prefix frontend run build
New-Item -ItemType Directory -Force backend/SoyCrunch.Api/wwwroot | Out-Null
Copy-Item frontend/dist/* backend/SoyCrunch.Api/wwwroot -Recurse -Force
dotnet publish backend/SoyCrunch.Api -c Release -o artifacts/app
Set-Location artifacts/app
dotnet SoyCrunch.Api.dll
```

The control panel and `/overlay` are then served at <http://127.0.0.1:5186/>. The app binds to loopback and restricts Host/Origin; add authentication before designing public access.

## Capture the stream

In OBS, add a Browser Source using the overlay URL, width 1080 and height 1920. In TikTok LIVE Studio, use window capture of the overlay browser window. Enable audio once inside the captured window; actual audio routing and capture require a manual check. Vietnamese gift narration depends on an available Vietnamese browser voice.

## Data and dependencies

There is no database, account system, payment flow, or cloud deployment. Session reset/restart clears guests, orders, and statistics. Incoming events are validated; gift streaks and recent event IDs are deduplicated. See [third-party notices](THIRD_PARTY_NOTICES.md) for dependency sources and licenses.

## Reference

Architecture studied from [kentjuno/chanh-dien-online](https://github.com/kentjuno/chanh-dien-online), commit `bee578d267c52940da08bc16171cfe8392b69d17`. This project uses newly written code and programmatic artwork; no upstream source, images, music, or watermark have been copied.
