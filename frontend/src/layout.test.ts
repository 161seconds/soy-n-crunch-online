import { describe, expect, it } from "vitest";
import { seatAt, walkPosition } from "./layout";
import { newerSession } from "./api";
import type { Session } from "./types";

describe("24-seat scene", () => {
  it("keeps every seat unique, visible, and within the restaurant floor", () => {
    const seats = Array.from({ length: 24 }, (_, i) => seatAt(i));
    expect(new Set(seats.map((s) => `${s.x},${s.y}`)).size).toBe(24);
    for (const seat of seats) {
      expect(seat.x).toBeGreaterThan(70);
      expect(seat.x).toBeLessThan(1010);
      expect(seat.y).toBeGreaterThan(1100);
      expect(seat.y).toBeLessThan(1830);
    }
  });
  it("rejects invalid seats instead of rendering a broken position", () => {
    for (const value of [-1, 24, 0.5, NaN])
      expect(() => seatAt(value)).toThrow(RangeError);
  });
  it("clamps the entrance animation and ends exactly at the seat", () => {
    const seat = seatAt(7);
    expect(walkPosition(seat, -1)).toEqual({ x: 540, y: 2020 });
    expect(walkPosition(seat, 2)).toEqual({ x: seat.x, y: seat.y });
  });
});

it("keeps the latest snapshot when HTTP and SignalR arrive out of order", () => {
  const current = { revision: 20 } as Session,
    old = { revision: 19 } as Session,
    next = { revision: 21 } as Session;
  expect(newerSession(current, old)).toBe(current);
  expect(newerSession(current, next)).toBe(next);
  expect(newerSession(null, old)).toBe(old);
});
