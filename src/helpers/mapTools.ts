import { Tile } from '@/types/gameObjects'
import { ObjKey, World } from '@/types/common'

export function getNeighbors (world: World, tile: Tile, dist = 1): Record<ObjKey, Tile> {
  const neighbors = {} as Record<ObjKey, Tile>

  const sizeX = world.sizeX
  const sizeY = world.sizeY

  // Helper to wrap x on the horizontal axis
  const wrapX = (x: number) => {
    const m = x % sizeX
    return m < 0 ? m + sizeX : m
  }

  // Compose the index key format used in world.tileIndex
  const idxKey = (x: number, y: number) => `[${x},${y}]`

  // Get tile by coordinates, respecting wrap on x and clamping y (no wrap on y)
  const getByXY = (x: number, y: number): Tile | undefined => {
    if (y < 0 || y >= sizeY) return undefined
    const wx = wrapX(x)
    const tile = world.tiles[idxKey(wx, y) as `${number},${number}`]
    if (!tile) throw new Error(`Tile not found at [${x},${y}]`)
    return tile
  }

  // Neighbor coordinate offsets for odd-r horizontal layout (flat-top hexes)
  const neighborCoords = (x: number, y: number): [number, number][] => {
    const isOdd = (y & 1) === 1
    if (isOdd) {
      return [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x + 1, y - 1],
        [x, y + 1],
        [x + 1, y + 1],
      ]
    } else {
      return [
        [x - 1, y],
        [x + 1, y],
        [x - 1, y - 1],
        [x, y - 1],
        [x - 1, y + 1],
        [x, y + 1],
      ]
    }
  }

  // BFS ring expansion to collect tiles at exact distance `dist`
  const visited = new Set<string>()
  const startIdx = idxKey(tile.x, tile.y)
  visited.add(startIdx)

  type Node = { x: number, y: number, d: number }
  const queue: Node[] = [{ x: tile.x, y: tile.y, d: 0 }]

  while (queue.length) {
    const cur = queue.shift() as Node
    if (cur.d === dist) {
      // Collect this ring tile (skip the origin which would only be here if dist==0)
      const t = getByXY(cur.x, cur.y)
      if (t && t.key !== tile.key) neighbors[t.key] = t
      // Do not expand further from nodes already at target distance
      continue
    }

    for (const [nx, ny] of neighborCoords(cur.x, cur.y)) {
      const keyStr = idxKey(wrapX(nx), ny)
      if (visited.has(keyStr)) continue
      // Only proceed if the tile exists (handles y out-of-bounds/poles)
      const t = getByXY(nx, ny)
      if (!t) continue
      visited.add(keyStr)
      queue.push({ x: nx, y: ny, d: cur.d + 1 })
    }
  }

  return neighbors
}
