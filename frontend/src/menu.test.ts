import { describe, expect, it } from "vitest";
import { itemName, menu, menuGroups, menuPages } from "./types";
import { drawDish } from "./Scene";

describe("shared menu", () => {
  it("has 28 unique dishes in three groups with unambiguous commands", () => {
    expect(menu).toHaveLength(28);
    expect(new Set(menu.map((item) => item.id)).size).toBe(28);
    expect(menuGroups).toEqual(["Sữa hạt", "Món lạnh", "Bánh & ăn vặt"]);
    const commands = menu.flatMap((item) => [item.command, ...item.aliases]);
    expect(
      new Set(commands.map((command) => command.toLowerCase().normalize()))
        .size,
    ).toBe(commands.length);
    expect(menu.some((item) => /tàu hủ|tau hu|tofu/i.test(item.name))).toBe(
      false,
    );
  });

  it("names the requested dishes and never mislabels an unknown ID as rice paper", () => {
    expect(itemName("milk")).toBe("Sữa đậu nành");
    expect(itemName("mung-bean")).toBe("Sữa đậu xanh");
    expect(itemName("panna-passion")).toBe("Panna cotta chanh dây");
    expect(itemName("iced-yogurt")).toBe("Yogurt đá");
    expect(itemName("removed-item")).toBe("Món không xác định");
  });

  it("keeps each overlay page in one category without skipping or repeating dishes", () => {
    const ids = menuPages.flatMap((page) => page.items.map((item) => item.id));
    expect(ids).toEqual(menu.map((item) => item.id));
    expect(new Set(ids).size).toBe(28);
    for (const page of menuPages) {
      expect(page.items.length).toBeGreaterThan(0);
      expect(page.items.length).toBeLessThanOrEqual(4);
      expect(page.items.every((item) => item.category === page.category)).toBe(
        true,
      );
      expect(page.page).toBeGreaterThanOrEqual(1);
      expect(page.page).toBeLessThanOrEqual(page.total);
    }
    const milkPages = menuPages.filter((page) => page.category === "Sữa hạt");
    expect(milkPages).toHaveLength(4);
    expect(milkPages.at(-1)?.items).toHaveLength(2);
    expect(menuPages[4].category).toBe("Món lạnh");
    expect(menuPages[6].category).toBe("Bánh & ăn vặt");
  });

  it.each(menu)("draws $name using finite Canvas 2D coordinates", (item) => {
    let painted = 0;
    const context = Object.fromEntries(
      [
        "save",
        "restore",
        "translate",
        "scale",
        "beginPath",
        "roundRect",
        "ellipse",
        "fill",
        "stroke",
        "moveTo",
        "lineTo",
      ].map((method) => [
        method,
        (...args: unknown[]) => {
          for (const value of args)
            if (typeof value === "number")
              expect(Number.isFinite(value)).toBe(true);
          if (method === "fill" || method === "stroke") painted++;
        },
      ]),
    ) as unknown as CanvasRenderingContext2D;
    expect(item.color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(item.command).toMatch(/^![a-z]+$/);
    expect(item.prepSeconds).toBeGreaterThanOrEqual(1);
    expect(item.prepSeconds).toBeLessThanOrEqual(4);
    drawDish(context, item.id, 43, -46, 0.58);
    expect(painted).toBeGreaterThan(0);
  });
});
