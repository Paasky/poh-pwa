export const hexDepth = 1.5;
export const hexWidth = Math.sqrt(3);

export const getWorldDepth = (worldSizeY: number) => hexDepth * (worldSizeY - 1);
export const getWorldWidth = (worldSizeX: number) => hexWidth * (worldSizeX - 1) + hexWidth / 2;
export const getWorldMinX = (worldWidth: number) => -worldWidth / 2;
export const getWorldMinZ = (worldDepth: number) => -worldDepth / 2;
export const getWorldMaxX = (worldWidth: number) => worldWidth / 2;
export const getWorldMaxZ = (worldDepth: number) => worldDepth / 2;

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
