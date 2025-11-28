import { Tile } from '@/objects/gameObjects'

export type Coords = { x: number, y: number }
export type NeighborMethod = 'chebyshev' | 'manhattan' | 'hex'

export function getNeighbors<T extends Tile> (
  size: Coords,
  tile: Coords,
  tiles: Record<string, T>,
  method: NeighborMethod = 'chebyshev',
  distance = 1,
): T[] {
  const coords = getNeighborCoords(size, tile, method, distance)
  const out: T[] = []
  for (const c of coords) {
    const t = tiles[Tile.getKey(c.x, c.y)]
    if (t) out.push(t as T)
  }
  return out
}

export function getNeighborCoords (
  size: Coords,
  tile: Coords,
  method: NeighborMethod = 'chebyshev',
  distance = 1,
): Coords[] {
  const neighbors: Coords[] = []
  const seen = new Set<Coords>()

  // TODO(hex): implement real hex adjacency using axial/offset coordinates
  // For now, fall back to chebyshev behavior for 'hex' to avoid breakage
  const effectiveMethod: 'chebyshev' | 'manhattan' = (method === 'hex' ? 'chebyshev' : method)

  for (let dy = -distance; dy <= distance; dy++) {
    const ny = tile.y + dy

    // Stop early if beyond top/bottom
    if (ny < 0 || ny >= size.y) continue

    for (let dx = -distance; dx <= distance; dx++) {

      // Skip if not in manhattan distance
      if (effectiveMethod === 'manhattan' && Math.abs(dx) + Math.abs(dy) > distance) continue

      // Include x-wrapping for new X
      const nx = ((tile.x + dx) % size.x + size.x) % size.x

      // Skip self, skip duplicates
      if (nx === tile.x && ny === tile.y) continue
      if (seen.has(tile)) continue

      // Add to neighbors and seen-list
      neighbors.push({ x: nx, y: ny })
      seen.add(tile)
    }
  }
  return neighbors
}

export function getRealCoords (size: Coords, tile: Coords): Coords | null {
  // If tile y is out of bounds, return null
  if (tile.y < 0 || tile.y >= size.y) return null

  // Wrap x on the horizontal axis
  const wrapX = (x: number) => {
    const m = x % size.x
    return m < 0 ? m + size.x : m
  }

  return { x: wrapX(tile.x), y: tile.y }
}
