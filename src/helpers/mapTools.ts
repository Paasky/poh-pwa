import { Coords } from '@/factories/TerraGenerator/helpers/neighbors'
import type { World } from '@/types/common'
import type { Tile } from '@/objects/game/gameObjects'

/**
 * Returns all hex neighbor coordinates within a given distance of a center coordinate.
 * NOTE! Hexes are flat-top, pointed horizontally
 *
 * @param size
 * @param center
 * @param dist
 */
export function getHexNeighborCoords (size: Coords, center: Coords, dist = 1): Coords[] {
  if (dist < 0) return []

  const result: Coords[] = []

  // Wrap X to [0, size.x)
  const wrapX = (x: number) => {
    const m = x % size.x
    return m < 0 ? m + size.x : m
  }

  // Use coord keys to dedupe visited nodes regardless of object identity
  const keyOf = (x: number, y: number) => `${x},${y}`
  const visited = new Set<string>()

  // Neighbor offsets for odd-r (flat-top) layout per Red Blob Games
  const neighborCoords = (coords: Coords): Coords[] => {
    const isOdd = (coords.y & 1) === 1
    return isOdd
      ? [
        { x: coords.x - 1, y: coords.y },     // W
        { x: coords.x + 1, y: coords.y },     // E
        { x: coords.x, y: coords.y - 1 },     // NW
        { x: coords.x + 1, y: coords.y - 1 }, // NE
        { x: coords.x, y: coords.y + 1 },     // SW
        { x: coords.x + 1, y: coords.y + 1 }, // SE
      ]
      : [
        { x: coords.x - 1, y: coords.y },     // W
        { x: coords.x + 1, y: coords.y },     // E
        { x: coords.x - 1, y: coords.y - 1 }, // NW
        { x: coords.x, y: coords.y - 1 },     // NE
        { x: coords.x - 1, y: coords.y + 1 }, // SW
        { x: coords.x, y: coords.y + 1 },     // SE
      ]
  }

  type Node = { x: number; y: number; d: number }
  const startX = wrapX(center.x)
  const startY = center.y
  if (startY < 0 || startY >= size.y) return []

  const queue: Node[] = [{ x: startX, y: startY, d: 0 }]
  visited.add(keyOf(startX, startY))

  while (queue.length) {
    const cur = queue.shift() as Node

    // Clamp on Y (no wrap across poles)
    if (cur.y < 0 || cur.y >= size.y) continue

    // Ensure X is wrapped (idempotent if already wrapped on enqueue)
    cur.x = wrapX(cur.x)

    if (cur.d === dist) {
      // At target distance: collect this coordinate (include axis-aligned)
      // Return only x,y as Coords
      result.push({ x: cur.x, y: cur.y })
      continue
    }

    for (const nb of neighborCoords(cur)) {
      const nx = wrapX(nb.x)
      const ny = nb.y
      if (ny < 0 || ny >= size.y) continue // respect polar clamps early
      const k = keyOf(nx, ny)
      if (visited.has(k)) continue
      visited.add(k)
      queue.push({ x: nx, y: ny, d: cur.d + 1 })
    }
  }

  return result
}

/**
 * Returns a record of neighbor tiles at exact hex distance `dist` from the given center tile.
 * - Uses odd-r horizontal hex layout (flat-top), wrapping on X and clamping on Y.
 * - Keys are the tile keys; values are the Tile objects from world.tiles.
 */
export function getNeighbors (world: World & {
  tiles: Record<string, Tile>
}, center: Tile, dist = 1): Record<string, Tile> {
  const coords = getHexNeighborCoords({ x: world.sizeX, y: world.sizeY }, { x: center.x, y: center.y }, dist)
  const out: Record<string, Tile> = {}
  for (const c of coords) {
    const t = world.tiles[`[${c.x},${c.y}]` as `${number},${number}`]
    if (t) out[t.key] = t
  }
  return out
}