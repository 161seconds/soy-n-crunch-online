export const WIDTH = 1080;
export const HEIGHT = 1920;

export function seatAt(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= 24)
    throw new RangeError("Seat must be between 0 and 23");
  const table = Math.floor(index / 2),
    row = Math.floor(table / 3),
    col = table % 3;
  const scale = 0.76 + row * 0.075;
  return {
    x: 180 + col * 360 + (index % 2 === 0 ? -92 : 92) * scale,
    y: 1170 + row * 190 + 52 * scale,
    scale,
  };
}

export function walkPosition(
  seat: ReturnType<typeof seatAt>,
  progress: number,
) {
  const t = Math.max(0, Math.min(1, progress));
  const vertical = Math.min(1, t / 0.7),
    horizontal = Math.min(1, Math.max(0, (t - 0.7) / 0.3));
  return {
    x: (1 - horizontal) * 540 + horizontal * seat.x,
    y: (1 - vertical) * 2020 + vertical * seat.y,
  };
}
