import { Tile } from "@/objects/game/Tile";

export type CompassHex = "ne" | "e" | "se" | "sw" | "w" | "nw";
export type CompassSquare = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
export type Coords = { x: number; y: number };
export type NeighborMethod = "chebyshev" | "manhattan" | "hex";

export function getHexNeighborDirections(y: number): Record<CompassHex, Coords> {
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

  // Wrap X to [0, size.x)
  const wrapX = (x: number) => {
    const m = x % size.x;
    return m < 0 ? m + size.x : m;
  };

  // Use coord keys to dedupe visited nodes regardless of object identity
  const keyOf = (x: number, y: number) => `${x},${y}`;
  const visited = new Set<string>();

  const neighborCoords = (coords: Coords): Coords[] =>
    Object.values(getHexNeighborDirections(coords.y)).map((d) => ({
      x: coords.x + d.x,
      y: coords.y + d.y,
    }));

  type Node = { x: number; y: number; d: number };
  const startX = wrapX(center.x);
  const startY = center.y;
  if (startY < 0 || startY >= size.y) return [];

  const queue: Node[] = [{ x: startX, y: startY, d: 0 }];
  visited.add(keyOf(startX, startY));

  while (queue.length) {
    const cur = queue.shift() as Node;

    // Clamp on Y (no wrap across poles)
    if (cur.y < 0 || cur.y >= size.y) continue;

    // Ensure X is wrapped (idempotent if already wrapped on enqueue)
    cur.x = wrapX(cur.x);

    if (cur.d === dist) {
      // At target distance: collect this coordinate (include axis-aligned)
      // Return only x,y as Coords
      result.push({ x: cur.x, y: cur.y });
      continue;
    }

    for (const nb of neighborCoords(cur)) {
      const nx = wrapX(nb.x);
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

  // Wrap x on the horizontal axis
  const wrapX = (x: number) => {
    const m = x % size.x;
    return m < 0 ? m + size.x : m;
  };

  return { x: wrapX(tile.x), y: tile.y };
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
