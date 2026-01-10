// NEW FUNCTIONS MUST BE TESTED BY math.test.ts

import { Coords, getCoordsFromTileKey } from "@/Common/Helpers/mapTools";
import { type EngineCoords } from "@/Actor/Human/Terrain/_terrainMeshTypes";
import { GameKey } from "@/Common/Models/_GameModel";
import { clamp } from "@/Common/Helpers/basicMath";

export * from "@/Common/Helpers/basicMath";

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

export interface MapBounds {
  worldWidth: number;
  worldDepth: number;
  minX: number;
  topZ: number;
}

export interface OrthoBounds {
  left: number;
  right: number;
  bottom: number;
  top: number;
}

/**
 * Returns the world-space bounds and dimensions for a given grid size.
 */
export const getMapBounds = (size: Coords): MapBounds => {
  const worldWidth = getWorldWidth(size.x);
  const worldDepth = getWorldDepth(size.y);
  return {
    worldWidth,
    worldDepth,
    minX: getWorldMinX(worldWidth),
    topZ: getWorldMinZ(worldDepth),
  };
};

/**
 * Returns the orthographic camera bounds for the full world.
 */
export const getFullWorldOrthoBounds = (size: Coords): OrthoBounds => {
  const { worldWidth, worldDepth } = getMapBounds(size);
  const halfWidth = worldWidth / 2;
  const halfDepth = worldDepth / 2;
  return {
    left: -halfWidth,
    right: halfWidth,
    bottom: -halfDepth,
    top: halfDepth,
  };
};

/**
 * Calculates the bounding box of a set of tiles in world space.
 */
export function calculateKnownBounds(
  gridSize: Coords,
  knownKeys: Set<GameKey> | GameKey[],
): OrthoBounds {
  const keys = Array.isArray(knownKeys) ? knownKeys : Array.from(knownKeys);

  if (keys.length === 0) {
    return { left: -10, right: 10, bottom: -10, top: 10 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  const halfHexWidth = hexWidth / 2;
  const halfHexDepth = hexDepth / 2;

  for (const key of keys) {
    const coords = getCoordsFromTileKey(key);
    const { x: worldX, z: worldZ } = tileCenter(gridSize, coords);

    minX = Math.min(minX, worldX - halfHexWidth);
    maxX = Math.max(maxX, worldX + halfHexWidth);
    minZ = Math.min(minZ, worldZ - halfHexDepth);
    maxZ = Math.max(maxZ, worldZ + halfHexDepth);
  }

  return { left: minX, right: maxX, bottom: minZ, top: maxZ };
}

/**
 * Calculates the orthographic camera bounds for the minimap based on pre-calculated known bounds.
 * Includes minimum height constraints and aspect ratio adjustment.
 */
export function calculateMinimapCameraBounds(
  knownBounds: OrthoBounds,
  canvasWidth: number,
  canvasHeight: number,
): OrthoBounds {
  let minX = knownBounds.left;
  let maxX = knownBounds.right;
  let minZ = knownBounds.bottom;
  let maxZ = knownBounds.top;

  const minTileHeight = 12;
  const minWorldHeight = minTileHeight * hexDepth;

  // Ensure minimum height
  const currentHeight = maxZ - minZ;
  if (currentHeight < minWorldHeight) {
    const diff = (minWorldHeight - currentHeight) / 2;
    minZ -= diff;
    maxZ += diff;
  }

  // Adjust width to match canvas aspect ratio
  const targetRatio = canvasWidth / canvasHeight;
  const currentWidth = maxX - minX;
  const actualHeight = maxZ - minZ;
  const currentRatio = currentWidth / actualHeight;

  if (currentRatio < targetRatio) {
    const diff = (actualHeight * targetRatio - currentWidth) / 2;
    minX -= diff;
    maxX += diff;
  } else {
    const diff = (currentWidth / targetRatio - actualHeight) / 2;
    minZ -= diff;
    maxZ += diff;
  }

  return {
    left: minX,
    right: maxX,
    bottom: minZ,
    top: maxZ,
  };
}

/**
 * Clamps engine coordinates to the given known bounds, handling world wrapping and boundaries.
 */
export function clampCoordsToBoundaries(
  coords: EngineCoords,
  gridSize: Coords,
  knownBounds: OrthoBounds | null,
): EngineCoords {
  const { worldWidth, minX: worldMinX } = getMapBounds(gridSize);
  const worldMaxX = worldMinX + worldWidth;
  const worldOrtho = getFullWorldOrthoBounds(gridSize);

  let { x, z } = coords;

  // 1. Clamp Z within known area (fallback to full world)
  const bounds = knownBounds || worldOrtho;
  z = clamp(z, bounds.bottom, bounds.top);

  // 2. Wrap X across world bounds
  if (x > worldMaxX) x -= worldWidth;
  else if (x < worldMinX) x += worldWidth;

  // 3. Clamp X within known area if it's smaller than world
  if (knownBounds) {
    const knownWidth = knownBounds.right - knownBounds.left;
    if (knownWidth < worldWidth * 0.95) {
      x = clamp(x, knownBounds.left, knownBounds.right);
    }
  }

  return { x, z };
}

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

/**
 * Map 0..1 percentage of world width/depth to EngineCoords
 */
export const getEngineCoordsFromPercent = (
  size: Coords,
  xPercent: number,
  yPercent: number,
): EngineCoords => {
  const worldWidth = getWorldWidth(size.x);
  const worldDepth = getWorldDepth(size.y);
  const widthPercent = clamp(xPercent, 0, 1);
  const depthPercent = clamp(yPercent, 0, 1);

  return {
    x: getWorldMinX(worldWidth) + widthPercent * worldWidth,
    // Flip Z (y=0 is north, y=max is south)
    z: getWorldMinZ(worldDepth) - depthPercent * worldDepth,
  };
};
