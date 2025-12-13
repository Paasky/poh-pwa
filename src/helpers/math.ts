import type { Coords } from "@/helpers/mapTools";
import type { Tile } from "@/objects/game/Tile";
import { type EngineCoords } from "@/factories/TerrainMeshBuilder/_terrainMeshTypes";

export const avg = (vals: number[]): number => (vals.length ? sum(vals) / vals.length : 0);

export const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

export const degToRad = (deg: number) => deg * (Math.PI / 180);

export const radToDeg = (rad: number) => rad * (180 / Math.PI);

export const sum = (vals: number[]): number => vals.reduce((acc, val) => acc + val, 0);

// Hex Trigonometry

export const hexDepth = 1.5;
export const hexWidth = Math.sqrt(3);

export const getWorldDepth = (worldSizeY: number) => hexDepth * (worldSizeY - 1);
export const getWorldWidth = (worldSizeX: number) => hexWidth * (worldSizeX - 1) + hexWidth / 2;
export const getWorldMinX = (worldWidth: number) => -worldWidth / 2;
export const getWorldMinZ = (worldDepth: number) => -worldDepth / 2;
export const getWorldMaxX = (worldWidth: number) => worldWidth / 2;
export const getWorldMaxZ = (worldDepth: number) => worldDepth / 2;

export const xInDir = (rad: number, radius: number): number => Math.cos(rad) * radius;
export const zInDir = (rad: number, radius: number): number => Math.sin(rad) * radius;
export const pointInDir = (rad: number, radius: number): EngineCoords => ({
  x: xInDir(rad, radius),
  z: zInDir(rad, radius),
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

/**
 * Inverse of tileCenter(): map world coordinates to the nearest odd-r (pointy-top) hex tile indices.
 *
 * Conventions:
 * - World extents and hex sizes come from this module (see getWorldWidth/Depth, hexWidth/hexDepth).
 * - X wraps (east/west); Y clamps to [0, size.y).
 * - Uses nearest-neighbor rounding to choose the closest tile center.
 */
export function worldToTileIndices(
  size: Coords,
  worldX: number,
  worldZ: number,
): { x: number; y: number } {
  // Translate world coords so that tile (0,0) center is at (0,0)
  const worldWidth = getWorldWidth(size.x);
  const worldDepth = getWorldDepth(size.y);
  const minX = getWorldMinX(worldWidth);
  const minZ = getWorldMinZ(worldDepth);
  const xw = worldX - minX;
  const zw = worldZ - minZ;

  // Axial coordinates (pointy-top) for size=1 grid
  // See: https://www.redblobgames.com/grids/hex-grids/
  const q = (Math.sqrt(3) / 3) * xw - (1 / 3) * zw;
  const r = (2 / 3) * zw;

  // Cube coordinates and rounding to nearest hex
  const cx = q;
  const cz = r;
  const cy = -cx - cz;
  let rx = Math.round(cx);
  let ry = Math.round(cy);
  let rz = Math.round(cz);
  const dx = Math.abs(rx - cx);
  const dy = Math.abs(ry - cy);
  const dz = Math.abs(rz - cz);

  if (dx > dy && dx > dz) {
    rx = -ry - rz;
  } else if (dy > dz) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  // Convert rounded axial (rx, rz) to odd-r offset
  let row = rz;
  // Clamp Y
  if (row < 0) row = 0;
  else if (row >= size.y) row = size.y - 1;
  const parity = row & 1;
  let col = rx + ((row - parity) >> 1);

  // Wrap X into [0, size.x)
  const m = col % size.x;
  col = m < 0 ? m + size.x : m;

  return { x: col, y: row };
}

/**
 * Convert a tile index to mask UV center coordinates in [0,1].
 */
export function tileIndexToMaskUV(size: Coords, x: number, y: number): { u: number; v: number } {
  const u = (x + 0.5) / size.x;
  const v = (y + 0.5) / size.y;
  return { u, v };
}
