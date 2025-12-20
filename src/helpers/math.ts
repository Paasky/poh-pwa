// NEW FUNCTIONS MUST BE TESTED BY math.test.ts

import type { Coords } from "@/helpers/mapTools";
import { type EngineCoords } from "@/factories/TerrainMeshBuilder/_terrainMeshTypes";

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

// Hex Trigonometry

export const hexDepth = 1.5;
export const hexWidth = Math.sqrt(3);

export const getWorldDepth = (worldSizeY: number) => hexDepth * (worldSizeY - 1);
export const getWorldWidth = (worldSizeX: number) => hexWidth * (worldSizeX - 1) + hexWidth / 2;

export const getWorldMinX = (worldWidth: number) => -worldWidth / 2;

// Flip Z as our map tile y0 = top
export const getWorldMinZ = (worldDepth: number) => worldDepth / 2;

export const getWorldMaxX = (worldWidth: number) => worldWidth / 2;

// Flip Z as our map tile y0 = top
export const getWorldMaxZ = (worldDepth: number) => -worldDepth / 2;

export const xInDir = (rad: number, radius: number): number => Math.cos(rad) * radius;
export const zInDir = (rad: number, radius: number): number => Math.sin(rad) * radius;
export const pointInDir = (rad: number, radius: number): EngineCoords => ({
  x: xInDir(rad, radius),
  z: zInDir(rad, radius),
});

export const tileCenter = (size: Coords, tile: Coords): EngineCoords => {
  const worldWidth = getWorldWidth(size.x);
  const worldDepth = getWorldDepth(size.y);
  const offsetX = getWorldMinX(worldWidth);
  const offsetZ = getWorldMinZ(worldDepth);

  return {
    x: offsetX + hexWidth * (tile.x + 0.5 * (tile.y & 1)),
    // Flip Z as our map tile y0 = top
    z: offsetZ - hexDepth * tile.y,
  };
};
