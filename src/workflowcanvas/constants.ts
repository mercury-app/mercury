export const cellSize = 24;
export const portWidth = cellSize / 2;
export const portHeight = cellSize;
export const padRadius = cellSize;
export const mainBodyWidth = cellSize * 8;
export const mainBodyHeight = cellSize * 4;
export const strokeWidth = 1;

export const clamp = (num: number, min: number, max: number): number => {
  return Math.max(min, Math.min(num, max));
};
