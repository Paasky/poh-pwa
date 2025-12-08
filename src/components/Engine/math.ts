import type { Coords } from "@/helpers/mapTools";
import type { Tile } from "@/objects/game/Tile";

export const hexDepth = 1.5;
export const hexWidth = Math.sqrt(3);

export const getWorldDepth = (worldSizeY: number) => hexDepth * (worldSizeY - 1);
export const getWorldWidth = (worldSizeX: number) => hexWidth * (worldSizeX - 1) + hexWidth / 2;
export const getWorldMinX = (worldWidth: number) => -worldWidth / 2;
export const getWorldMinZ = (worldDepth: number) => -worldDepth / 2;
export const getWorldMaxX = (worldWidth: number) => worldWidth / 2;
export const getWorldMaxZ = (worldDepth: number) => worldDepth / 2;

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// Hex Trigonometry

// x,z position of a hex corner, relative to the center
export const getHexPointPosition = (
  centerX: number,
  centerZ: number,
  angle: number,
  distance = 1,
) => ({
  x: centerX + Math.cos(angle) * distance,
  z: centerZ + Math.sin(angle) * distance,
});

export const tileCenter = (size: Coords, tile: Tile): { x: number; z: number } => {
  const worldWidth = getWorldWidth(size.x);
  const worldDepth = getWorldDepth(size.y);
  const offsetX = getWorldMinX(worldWidth);
  const offsetZ = getWorldMinZ(worldDepth);

  return {
    x: offsetX + hexWidth * (tile.x + 0.5 * (tile.y & 1)),
    z: offsetZ + hexDepth * tile.y,
  };
};

export const avg = (vals: number[]): number => (vals.length ? sum(vals) / vals.length : 0);
export const sum = (vals: number[]): number => vals.reduce((acc, val) => acc + val, 0);
export const degToRad = (deg: number) => deg * (Math.PI / 180);
export const radToDeg = (rad: number) => rad * (180 / Math.PI);
