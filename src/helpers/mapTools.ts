import { Tile } from "@/objects/game/Tile";
import { GameKey } from "@/objects/game/_GameObject";
import { getRandom } from "@/helpers/arrayTools";

export type CompassHexEdge = "ne" | "e" | "se" | "sw" | "w" | "nw";
export type CompassHexCorner = "n" | "se" | "sw" | "s" | "nw" | "ne";
export type CompassSquare = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
export type Coords = { x: number; y: number };
export type NeighborMethod = "chebyshev" | "manhattan" | "hex";

export function getHexNeighborDirections(y: number): Record<CompassHexEdge, Coords> {
  const isOdd = (y & 1) === 1;
  return isOdd
    ? {
        w: { x: -1, y: 0 },
        e: { x: 1, y: 0 },
        nw: { x: 0, y: -1 },
        ne: { x: 1, y: -1 },
        sw: { x: 0, y: 1 },
        se: { x: 1, y: 1 },
      }
    : {
        w: { x: -1, y: 0 },
        e: { x: 1, y: 0 },
        nw: { x: -1, y: -1 },
        ne: { x: 0, y: -1 },
        sw: { x: -1, y: 1 },
        se: { x: 0, y: 1 },
      };
}

export function getHexNeighbor(
  size: Coords,
  tile: Tile,
  tiles: Record<GameKey, Tile>,
  direction: CompassHexEdge,
): Tile | null {
  const dirCoords = getHexNeighborDirections(tile.y)[direction];
  return dirCoords
    ? getTile(
        size,
        {
          x: tile.x + dirCoords.x,
          y: tile.y + dirCoords.y,
        },
        tiles,
      )
    : null;
}

// Returns the two neighbor direction deltas (relative to the center tile)
// for the two tiles that meet at the given corner/edge of a POINTY-TOP hex
// in an odd-r (row-offset) layout.
//
// Edge names map to hex corners as follows (angles for reference):
//   ne (≈30°), n (≈90°), nw (≈150°), sw (≈210°), s (≈270°), se (≈330°)
//
// Because NE/NW/SE/SW offsets depend on row parity, this helper requires `y`.
export function getHexCornerNeighborDirections(y: number, corner: CompassHexCorner): Coords[] {
  const dirs = getHexNeighborDirections(y);

  // For a corner, the two adjacent tiles are reached by moving 1 step in each
  // of the two axial directions that span that corner.
  switch (corner) {
    case "ne":
      // Adjacent tiles: E and NE
      return [dirs.e, dirs.ne];
    case "n":
      // Adjacent tiles: NE and NW
      return [dirs.ne, dirs.nw];
    case "nw":
      // Adjacent tiles: NW and W
      return [dirs.nw, dirs.w];
    case "sw":
      // Adjacent tiles: W and SW
      return [dirs.w, dirs.sw];
    case "s":
      // Adjacent tiles: SW and SE
      return [dirs.sw, dirs.se];
    case "se":
    default:
      // Adjacent tiles: SE and E
      return [dirs.se, dirs.e];
  }
}

export function getHexCornerNeighbors(
  size: Coords,
  tile: Tile,
  tiles: Record<GameKey, Tile>,
  corner: CompassHexCorner,
): Tile[] {
  const dirs = getHexCornerNeighborDirections(tile.y, corner);
  const out = [] as Tile[];
  for (const dir of dirs) {
    // Returns null if that direction is out-of-bounds; wraps X if needed
    const dirTile = getTile<Tile>(size, { x: tile.x + dir.x, y: tile.y + dir.y }, tiles);
    if (dirTile) {
      out.push(dirTile);
    }
  }
  return out;
}

/**
 * Returns all hex neighbor coordinates within a given distance of a center coordinate.
 *
 * Project standard:
 * - POINTY-TOP hexes using odd-r (row-offset) layout
 * - Wrap on X (east/west), clamp on Y (no polar wrap)
 *
 * @param size
 * @param center
 * @param dist
 */
export function getHexNeighborCoords(size: Coords, center: Coords, dist = 1): Coords[] {
  if (dist < 0) return [];

  const result: Coords[] = [];

  // Use coord keys to dedupe visited nodes regardless of object identity
  const keyOf = (x: number, y: number) => `${x},${y}`;
  const visited = new Set<string>();

  const neighborCoords = (coords: Coords): Coords[] =>
    Object.values(getHexNeighborDirections(coords.y)).map((d) => ({
      x: coords.x + d.x,
      y: coords.y + d.y,
    }));

  type Node = { x: number; y: number; d: number };
  const startX = wrapX(size, center.x);
  const startY = center.y;
  if (startY < 0 || startY >= size.y) return [];

  const queue: Node[] = [{ x: startX, y: startY, d: 0 }];
  visited.add(keyOf(startX, startY));

  while (queue.length) {
    const cur = queue.shift() as Node;

    // Clamp on Y (no wrap across poles)
    if (cur.y < 0 || cur.y >= size.y) continue;

    // Ensure X is wrapped (idempotent if already wrapped on enqueue)
    cur.x = wrapX(size, cur.x);

    if (cur.d === dist) {
      // At target distance: collect this coordinate (include axis-aligned)
      // Return only x,y as Coords
      result.push({ x: cur.x, y: cur.y });
      continue;
    }

    for (const nb of neighborCoords(cur)) {
      const nx = wrapX(size, nb.x);
      const ny = nb.y;
      if (ny < 0 || ny >= size.y) continue; // respect polar clamps early
      const k = keyOf(nx, ny);
      if (visited.has(k)) continue;
      visited.add(k);
      queue.push({ x: nx, y: ny, d: cur.d + 1 });
    }
  }

  return result;
}

export function getNeighbors<T extends Tile>(
  size: Coords,
  tile: Coords,
  tiles: Record<string, T>,
  method: NeighborMethod = "chebyshev",
  distance = 1,
): T[] {
  const coords = getNeighborCoords(size, tile, method, distance);
  const out: T[] = [];
  for (const c of coords) {
    const t = tiles[Tile.getKey(c.x, c.y)];
    if (t) out.push(t as T);
  }
  return out;
}

export function getNeighborCoords(
  size: Coords,
  tile: Coords,
  method: NeighborMethod = "chebyshev",
  distance = 1,
): Coords[] {
  const neighbors: Coords[] = [];
  // Track neighbors we've already added using a stable string key
  const seen = new Set<string>();

  if (method === "hex") {
    return getHexNeighborCoords(size, tile, distance);
  }

  for (let dy = -distance; dy <= distance; dy++) {
    const ny = tile.y + dy;

    // Stop early if beyond top/bottom
    if (ny < 0 || ny >= size.y) continue;

    for (let dx = -distance; dx <= distance; dx++) {
      // Skip if not in manhattan distance
      if (method === "manhattan" && Math.abs(dx) + Math.abs(dy) > distance) continue;

      // Include x-wrapping for new X
      const nx = (((tile.x + dx) % size.x) + size.x) % size.x;

      // Skip self, skip duplicates
      if (nx === tile.x && ny === tile.y) continue;
      const nKey = Tile.getKey(nx, ny);
      if (seen.has(nKey)) continue;

      // Add to neighbors and seen-list
      neighbors.push({ x: nx, y: ny });
      seen.add(nKey);
    }
  }

  // 3 is the minimum of manhattan dist 1, something is off! Stop here to not cause strange bugs further down the line
  if (neighbors.length < 3) {
    throw new Error(
      `Not enough neighbors found for tile ${Tile.getKey(tile.x, tile.y)}: ${neighbors.length}`,
    );
  }
  return neighbors;
}

export function getRealCoords(size: Coords, tile: Coords): Coords | null {
  // If tile y is out of bounds, return null
  if (tile.y < 0 || tile.y >= size.y) return null;

  return { x: wrapX(size, tile.x), y: tile.y };
}

export function getTile<T extends Tile>(
  size: Coords,
  coords: Coords,
  tiles: Record<string, T>,
): T | null {
  const realCoords = getRealCoords(size, coords);
  const t = realCoords ? tiles[Tile.getKey(realCoords.x, realCoords.y)] : undefined;
  return t || null;
}

// Wrap x on the horizontal axis
export function wrapX(size: Coords, x: number) {
  const m = x % size.x;
  return m < 0 ? m + size.x : m;
}

export const waterLevel = -0.2;
export const maxWaterHeight = -0.3;

export function tileHeight(tile: Tile, forLogic: boolean = false): number {
  if (tile.terrain.key === "terrainType:ocean") {
    return forLogic ? waterLevel : getRandom([-1, -1.1, -1.2]);
  }
  if (tile.terrain.key === "terrainType:sea") {
    return forLogic ? waterLevel : getRandom([-0.65, -0.7, -0.75]);
  }
  if (tile.terrain.key === "terrainType:coast") {
    return forLogic ? waterLevel : getRandom([-0.38, -0.4, -0.42]);
  }
  if (tile.terrain.key === "terrainType:lake" || tile.terrain.key === "terrainType:majorRiver") {
    return forLogic ? waterLevel : getRandom([-0.4]);
  }
  if (tile.elevation.key === "elevationType:hill") {
    return forLogic ? 0.25 : getRandom([0.3, 0.35, 0.4]);
  }
  if (tile.elevation.key === "elevationType:mountain") {
    return forLogic ? 0.8 : getRandom([0.6, 0.8, 1, 1.2]);
  }
  if (tile.elevation.key === "elevationType:snowMountain") {
    return forLogic ? 1.6 : getRandom([1.4, 1.6, 1.8, 2]);
  }
  return 0;
}
