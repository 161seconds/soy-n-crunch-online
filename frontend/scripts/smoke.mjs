import assert from "node:assert/strict";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

const base = process.env.SOYCRUNCH_API ?? "http://127.0.0.1:5186";
async function request(path, body) {
  const response = await fetch(
    base + path,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  assert.equal(response.ok, true, `${path}: HTTP ${response.status}`);
  return response.json();
}
const before = await request("/api/session");
assert.ok(
  before.connector.status !== "connected" &&
    before.guests.every((guest) => guest.demo),
  "Smoke test clears a disposable session. Disconnect TikTok and remove real guests first.",
);
let firstState, secondState;
const first = new HubConnectionBuilder()
  .withUrl(base + "/hubs/live")
  .configureLogging(LogLevel.Error)
  .build();
const second = new HubConnectionBuilder()
  .withUrl(base + "/hubs/live")
  .configureLogging(LogLevel.Error)
  .build();
first.on("session", (state) => {
  firstState = state;
});
second.on("session", (state) => {
  secondState = state;
});
async function until(condition, timeout = 4000) {
  const deadline = Date.now() + timeout;
  while (!condition()) {
    assert.ok(
      Date.now() < deadline,
      "Timed out waiting for synchronized state",
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
const event = (type, extras = {}) => ({
  eventId: crypto.randomUUID(),
  viewerId: "smoke-alice",
  name: "Khách kiểm thử",
  type,
  demo: true,
  ...extras,
});
try {
  await request("/api/session/reset", {});
  await first.start();
  await second.start();
  const order = event("chat", { text: "!sua" });
  assert.equal((await request("/api/events", order)).outcome, "accepted");
  assert.equal((await request("/api/events", order)).outcome, "duplicate");
  await until(
    () => firstState?.guests.length === 1 && secondState?.orders.length === 1,
  );
  const gift = event("gift", {
    diamondCount: 10,
    repeatCount: 3,
    giftType: 1,
    repeatEnd: false,
  });
  assert.equal((await request("/api/events", gift)).outcome, "ignored");
  assert.equal(
    (await request("/api/events", { ...gift, repeatEnd: true })).outcome,
    "accepted",
  );
  await until(
    () =>
      firstState?.stats.diamonds === 30 && secondState?.stats.diamonds === 30,
  );
  await first.stop();
  await request("/api/events", event("like", { likeCount: 7 }));
  await first.start();
  await until(
    () => firstState?.stats.likes === 7 && secondState?.stats.likes === 7,
  );
  await until(
    () => firstState?.stats.served === 1 && secondState?.stats.served === 1,
    13_000,
  );
  for (let i = 1; i < 24; i++)
    await request("/api/events", event("join", { viewerId: `smoke-${i}` }));
  assert.equal(
    (
      await request(
        "/api/events",
        event("join", { viewerId: "smoke-overflow" }),
      )
    ).outcome,
    "full",
  );
  await until(
    () => firstState?.guests.length === 24 && secondState?.guests.length === 24,
  );
  assert.equal(new Set(firstState.guests.map((guest) => guest.seat)).size, 24);
  console.log(
    "PASS: two SignalR clients, reconnect snapshot, order lifecycle, gift streak, replay protection, 24-seat capacity.",
  );
} finally {
  await first.stop();
  await second.stop();
  await request("/api/session/reset", {});
}
