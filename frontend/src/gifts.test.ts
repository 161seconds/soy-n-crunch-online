import { describe, expect, it } from "vitest";
import { activeGifts, drawGiftEffects } from "./Scene";
import type { Session } from "./types";
import { giftRules } from "./types";

const now = Date.parse("2026-11-03T00:00:10Z");
const gift = (id: string, age = 0, effect: Session["feed"][number]["effect"] = "hearts") => ({
  id, kind: "gift", text: "Cảm ơn khách", at: new Date(now - age).toISOString(), effect,
});

function render(feed: Session["feed"], time: number, reduced = false) {
  const calls: unknown[][] = [];
  const context = Object.fromEntries([
    "save", "restore", "translate", "scale", "beginPath", "moveTo", "lineTo",
    "bezierCurveTo", "ellipse", "fill", "stroke", "fillRect", "roundRect", "fillText",
  ].map((method) => [method, (...args: unknown[]) => {
    for (const value of args)
      if (typeof value === "number") expect(Number.isFinite(value)).toBe(true);
    calls.push([method, ...args]);
  }])) as unknown as CanvasRenderingContext2D;
  Object.defineProperty(context, "globalAlpha", { set(value: number) {
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  } });
  drawGiftEffects(context, feed, time, reduced);
  expect(calls.filter(([name]) => name === "save")).toHaveLength(
    calls.filter(([name]) => name === "restore").length,
  );
  return calls;
}

describe("gift effects", () => {
  it("expires gifts after seven seconds and never replays old, invalid, or future events", () => {
    const feed = [gift("expired", 7000), gift("old", 20000), gift("future", -1),
      { ...gift("invalid"), at: "invalid" }, { ...gift("chat"), kind: "chat" }];
    expect(activeGifts(feed, now)).toEqual([]);
    expect(render(feed, now)).toEqual([]);
    expect(activeGifts([gift("last-frame", 6999)], now)).toHaveLength(1);
  });

  it("caps a busy snapshot at the three newest recent gifts", () => {
    const feed = Array.from({ length: 40 }, (_, i) => gift(String(i), 1000));
    expect(activeGifts(feed, now).map((entry) => entry.id)).toEqual(["37", "38", "39"]);
  });

  it.each(giftRules.map((rule) => rule.effect as NonNullable<Session["feed"][number]["effect"]>))("draws finite, bounded %s particles throughout the effect", (effect) => {
    for (const age of [0, 349, 350, 700, 1500, 2800, 5500, 6999]) {
      const calls = render([gift("tier", age, effect)], now);
      expect(calls.length).toBeGreaterThan(0);
      expect(calls.filter(([name]) => ["fill", "stroke", "fillRect"].includes(String(name))).length).toBeLessThanOrEqual(200);
    }
  });

  it("renders the same event identically across clients and resumes its current age", () => {
    const feed = [gift("same-event", 1500, "festival")];
    const first = render(feed, now);
    expect(render(feed, now)).toEqual(first);
    expect(render(feed, now + 1000)).not.toEqual(first);
    expect(render(feed, now + 7000)).toEqual([]);
  });

  it("draws no moving particles for reduced motion, including legacy gift entries", () => {
    const feed = giftRules.map((rule) => gift(rule.effect, 500, rule.effect as NonNullable<Session["feed"][number]["effect"]>));
    expect(render(feed, now, true)).toEqual([]);
    expect(render([{ ...gift("legacy"), effect: undefined }], now).some(([name]) => name === "bezierCurveTo")).toBe(true);
  });

  it("increases combo density with a fixed ceiling and accepts community celebrations", () => {
    const single = render([gift("rose", 1000, "flowers")], now);
    const combo = render([{ ...gift("rose", 1000, "flowers"), repeatCount: 10000 }], now);
    expect(combo.length).toBeGreaterThan(single.length);
    expect(combo.filter(([name]) => name === "ellipse").length).toBeLessThanOrEqual(108);
    const celebration = { ...gift("goal", 1000, "festival"), kind: "milestone" };
    expect(activeGifts([celebration], now)).toEqual([celebration]);
    expect(render([celebration], now).length).toBeGreaterThan(0);
    expect(activeGifts([celebration], now + 7000)).toEqual([]);
  });
});
