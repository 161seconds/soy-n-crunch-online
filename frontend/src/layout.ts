export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TABLE_COUNT = 18;
export const CAPACITY = TABLE_COUNT * 2;

export function tableAt(index: number) {
  const row = Math.floor(index / 4),
    columns = Math.min(4, TABLE_COUNT - row * 4);
  return {
    x: WIDTH / 2 + ((index % 4) - (columns - 1) / 2) * 260,
    y: 1150 + row * 154,
    scale: 0.66 + row * 0.02,
  };
}

export function seatAt(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= CAPACITY)
    throw new RangeError(`Seat must be between 0 and ${CAPACITY - 1}`);
  const table = tableAt(Math.floor(index / 2));
  return {
    x: table.x + (index % 2 === 0 ? -92 : 92) * table.scale,
    y: table.y + 52 * table.scale,
    scale: table.scale,
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
