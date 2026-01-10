export const avg = (vals: number[]): number => (vals.length ? sum(vals) / vals.length : 0);

export const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

export const degToRad = (deg: number) => deg * (Math.PI / 180);

export const radToDeg = (rad: number) => rad * (180 / Math.PI);

export const sum = (vals: number[]): number => vals.reduce((acc, val) => acc + val, 0);

/**
 * min <= value < max
 * Example: wrap(5, 0, 5) -> 0
 */
export const wrapExclusive = (val: number, min: number, max: number): number => {
  const range = max - min;
  return ((((val - min) % range) + range) % range) + min;
};

/**
 min <= value <= max
 * Example: wrapInclusive(13, 1, 12) -> 1
 */
export const wrapInclusive = (val: number, min: number, max: number): number => {
  const range = max - min + 1;
  return ((((val - min) % range) + range) % range) + min;
};
