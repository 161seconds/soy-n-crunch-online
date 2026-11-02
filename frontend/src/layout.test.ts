import { describe, expect, it } from "vitest";
import { seatAt, tableAt, walkPosition } from "./layout";
import { newerSession } from "./api";
import type { Session } from "./types";

describe("36-seat scene", () => {
  it("keeps every seat unique, visible, and within the restaurant floor", () => {
    const seats = Array.from({ length: 36 }, (_, i) => seatAt(i));
    expect(new Set(seats.map((s) => `${s.x},${s.y}`)).size).toBe(36);
    for (const seat of seats) {
      expect(seat.x).toBeGreaterThan(70);
      expect(seat.x).toBeLessThan(1010);
      expect(seat.y).toBeGreaterThan(1100);
      expect(seat.y).toBeLessThan(1830);
    }
  });
  it("rejects invalid seats instead of rendering a broken position", () => {
    for (const value of [-1, 36, 0.5, NaN])
      expect(() => seatAt(value)).toThrow(RangeError);
  });
  it("aligns 18 tables with paired seats and separates seated rows", () => {
    const tables = Array.from({ length: 18 }, (_, i) => tableAt(i));
    expect(new Set(tables.map((t) => `${t.x},${t.y}`)).size).toBe(18);
    for (const [i, table] of tables.entries()) {
      const left = seatAt(i * 2),
        right = seatAt(i * 2 + 1);
      expect(left.x).toBeLessThan(table.x);
      expect(right.x).toBeGreaterThan(table.x);
      expect((left.x + right.x) / 2).toBeCloseTo(table.x);
      expect(left.y).toBe(right.y);
      expect(left.y).toBeGreaterThan(table.y);
    }
    const rows = [0, 8, 16, 24, 32].map(seatAt);
    for (let i = 1; i < rows.length; i++)
      expect(rows[i].y - 190 * rows[i].scale).toBeGreaterThan(
        rows[i - 1].y + 12 * rows[i - 1].scale,
      );
    expect(tables[16].x + tables[17].x).toBe(1080);
  });
  it("clamps the entrance animation and ends exactly at the seat", () => {
    const seat = seatAt(7);
    expect(walkPosition(seat, -1)).toEqual({ x: 540, y: 2020 });
    expect(walkPosition(seat, 2)).toEqual({ x: seat.x, y: seat.y });
  });
  it("leaves room for the menu, a center aisle, and the footer at full capacity", () => {
    const first = seatAt(0),
      last = seatAt(35);
    expect(first.y - 242 * first.scale).toBeGreaterThan(1020);
    expect(last.y + 12 * last.scale).toBeLessThan(1827);
    for (let row = 0; row < 5; row++) {
      const left = seatAt(row * 8 + (row === 4 ? 1 : 3)),
        right = seatAt(row * 8 + (row === 4 ? 2 : 4));
      expect(left.x + 41 * left.scale).toBeLessThan(520);
      expect(right.x - 41 * right.scale).toBeGreaterThan(560);
    }
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
