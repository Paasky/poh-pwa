import { Color3 } from "@babylonjs/core";

/** Default season month index (June = 6 → early summer). */
export const defaultMonth: number = 6;

export const seasonPalettes = [
  { sky: new Color3(0.86, 0.9, 0.95), ground: new Color3(0.71, 0.77, 0.82) }, // Jan
  { sky: new Color3(0.86, 0.9, 0.95), ground: new Color3(0.71, 0.77, 0.82) }, // Feb
  { sky: new Color3(0.81, 0.91, 1.0), ground: new Color3(0.65, 0.84, 0.65) }, // Mar
  { sky: new Color3(0.81, 0.91, 1.0), ground: new Color3(0.65, 0.84, 0.65) }, // Apr
  { sky: new Color3(0.81, 0.91, 1.0), ground: new Color3(0.65, 0.84, 0.65) }, // May
  { sky: new Color3(0.74, 0.88, 1.0), ground: new Color3(0.55, 0.86, 0.4) }, // Jun
  { sky: new Color3(0.74, 0.88, 1.0), ground: new Color3(0.55, 0.86, 0.4) }, // Jul
  { sky: new Color3(0.74, 0.88, 1.0), ground: new Color3(0.55, 0.86, 0.4) }, // Aug
  { sky: new Color3(1.0, 0.85, 0.7), ground: new Color3(0.85, 0.48, 0.26) }, // Sep
  { sky: new Color3(1.0, 0.85, 0.7), ground: new Color3(0.85, 0.48, 0.26) }, // Oct
  { sky: new Color3(1.0, 0.85, 0.7), ground: new Color3(0.85, 0.48, 0.26) }, // Nov
  { sky: new Color3(0.86, 0.9, 0.95), ground: new Color3(0.71, 0.77, 0.82) }, // Dec
];

export function getBlendedSeasonPalette(monthFloat: number) {
  const m = (((monthFloat - 1) % 12) + 12) % 12;
  const shifted = (((m - 0.5) % 12) + 12) % 12;
  const iA = Math.floor(shifted),
    iB = (iA + 1) % 12;
  const t = shifted - iA;
  const s = t * t * (3 - 2 * t); // smoothstep
  return {
    sky: Color3.Lerp(seasonPalettes[iA].sky, seasonPalettes[iB].sky, s),
    ground: Color3.Lerp(seasonPalettes[iA].ground, seasonPalettes[iB].ground, s),
  };
}
