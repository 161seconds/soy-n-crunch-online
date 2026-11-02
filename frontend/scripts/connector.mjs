import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

const base = process.env.SOYCRUNCH_API ?? "http://127.0.0.1:5186";
const username = process.argv[2] ?? "one61secondz";
const response = await fetch(base + "/api/tiktok/connect", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username }),
  signal: AbortSignal.timeout(26_000),
});
if (!response.ok)
  throw new Error(
    `Connect failed: HTTP ${response.status}: ${await response.text()}`,
  );
let session = await response.json();
const hub = new HubConnectionBuilder()
  .withUrl(base + "/hubs/live")
  .configureLogging(LogLevel.Error)
  .build();
try {
  if (session.connector.status === "connected") {
    hub.on("session", (state) => {
      session = state;
    });
    await hub.start();
    console.error(
      "Connected. Observing public events for 30 seconds; this script sends no TikTok messages.",
    );
    await new Promise((resolve) => setTimeout(resolve, 30_000));
  }
  console.log(
    JSON.stringify(
      {
        library: "TikTokLive_Sharp 1.2.3",
        observedAt: new Date().toISOString(),
        ...session.connector,
      },
      null,
      2,
    ),
  );
  process.exitCode = session.connector.status === "connected" ? 0 : 2;
} finally {
  await hub.stop();
}
