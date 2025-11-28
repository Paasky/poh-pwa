import { describe, expect, it } from 'vitest'
import { getNeighbors } from '../../src/helpers/mapTools'
import { ObjKey, World } from '../../src/types/common'
import { Tile } from '../../src/objects/gameObjects'

describe('mapTools.getNeighbors', () => {
  const world = buildMockWorld(60, 30)

  it('returns correct neighbor counts at distances 1, 2, 3 for a center tile', () => {
    const center = tileAt(world, 30, 15)
    const n1 = getNeighbors(world, center, 1)
    const n2 = getNeighbors(world, center, 2)
    const n3 = getNeighbors(world, center, 3)
    const d1 = Object.keys(n1).length
    const d2 = Object.keys(n2).length
    const d3 = Object.keys(n3).length

    // Infinite hex grid rings are 6, 12, 18 ...
    expect(d1).toBe(6)
    expect(d2).toBe(12)
    expect(d3).toBe(18)

    // Super-precise coordinate verification
    const a1 = toIdxSet(n1)
    const a2 = toIdxSet(n2)
    const a3 = toIdxSet(n3)
    const e1 = expectedRingIdxSet(world, center.x, center.y, 1)
    const e2 = expectedRingIdxSet(world, center.x, center.y, 2)
    const e3 = expectedRingIdxSet(world, center.x, center.y, 3)
    expect(sort([...a1])).toEqual(sort([...e1]))
    expect(sort([...a2])).toEqual(sort([...e2]))
    expect(sort([...a3])).toEqual(sort([...e3]))
  })

  it('returns correct neighbor counts at distances 1, 2, 3 for the top-left tile (0,0)', () => {
    const topLeft = tileAt(world, 0, 0)
    const n1 = getNeighbors(world, topLeft, 1)
    const n2 = getNeighbors(world, topLeft, 2)
    const n3 = getNeighbors(world, topLeft, 3)
    const d1 = Object.keys(n1).length
    const d2 = Object.keys(n2).length
    const d3 = Object.keys(n3).length

    // With wrap on X and clamped Y (no wrap on top), counts are clipped per ring
    expect(d1).toBe(4)
    expect(d2).toBe(7)
    expect(d3).toBe(10)

    // Super-precise coordinate verification
    const a1 = toIdxSet(n1)
    const a2 = toIdxSet(n2)
    const a3 = toIdxSet(n3)
    const e1 = expectedRingIdxSet(world, topLeft.x, topLeft.y, 1)
    const e2 = expectedRingIdxSet(world, topLeft.x, topLeft.y, 2)
    const e3 = expectedRingIdxSet(world, topLeft.x, topLeft.y, 3)
    expect(sort([...a1])).toEqual(sort([...e1]))
    expect(sort([...a2])).toEqual(sort([...e2]))
    expect(sort([...a3])).toEqual(sort([...e3]))
  })

  it('returns correct neighbor counts at distances 1, 2, 3 for the bottom-left tile (0,sizeY-1)', () => {
    const bottomLeft = tileAt(world, 0, world.sizeY - 1)
    const n1 = getNeighbors(world, bottomLeft, 1)
    const n2 = getNeighbors(world, bottomLeft, 2)
    const n3 = getNeighbors(world, bottomLeft, 3)
    const d1 = Object.keys(n1).length
    const d2 = Object.keys(n2).length
    const d3 = Object.keys(n3).length

    // Symmetric to top edge due to Y clamping, still with X wrap
    expect(d1).toBe(4)
    expect(d2).toBe(7)
    expect(d3).toBe(10)

    // Super-precise coordinate verification
    const a1 = toIdxSet(n1)
    const a2 = toIdxSet(n2)
    const a3 = toIdxSet(n3)
    const e1 = expectedRingIdxSet(world, bottomLeft.x, bottomLeft.y, 1)
    const e2 = expectedRingIdxSet(world, bottomLeft.x, bottomLeft.y, 2)
    const e3 = expectedRingIdxSet(world, bottomLeft.x, bottomLeft.y, 3)
    expect(sort([...a1])).toEqual(sort([...e1]))
    expect(sort([...a2])).toEqual(sort([...e2]))
    expect(sort([...a3])).toEqual(sort([...e3]))
  })
})

// Minimal, self-contained world builder for testing getNeighbors without store deps
const buildMockWorld = (sizeX: number, sizeY: number): World => {
  const world = {
    id: 'w',
    sizeX,
    sizeY,
    turn: 0,
    year: 0,
    currentPlayer: '' as ObjKey,
    tiles: {} as World['tiles']
  } as World

  for (let y = 0; y < sizeY; y++) {
    for (let x = 0; x < sizeX; x++) {
      const id = crypto.randomUUID()
      world.tiles[`[${x},${y}]` as `${number},${number}`] = {
        objType: 'GameObject',
        class: 'tile',
        id: id,
        key: `tile:${id}`,
        concept: 'conceptType:tile',
        x,
        y,
      } as any as Tile
    }
  }

  return world
}

// Helper to access a tile by coordinates using the world's index key format
const tileAt = (world: World, x: number, y: number) => {
  return world.tiles[`[${x},${y}]` as `${number},${number}`]
}

// ---------- Precise coordinate verification helpers ----------
const idxKey = (x: number, y: number) => `[${x},${y}]`

const sort = (arr: string[]) => arr.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

// Build a Set of index keys for the exact ring at distance `dist` from (sx, sy)
// Rules mirror the map: wrap on X, clamp on Y (no vertical wrap), odd-r horizontal hex layout
const expectedRingIdxSet = (world: World, sx: number, sy: number, dist: number): Set<string> => {
  const sizeX = world.sizeX
  const sizeY = world.sizeY

  const wrapX = (x: number) => {
    const m = x % sizeX
    return m < 0 ? m + sizeX : m
  }

  const neighborCoords = (x: number, y: number): [number, number][] => {
    const isOdd = (y & 1) === 1
    return isOdd
      ? [
        [x - 1, y], [x + 1, y],
        [x, y - 1], [x + 1, y - 1],
        [x, y + 1], [x + 1, y + 1],
      ]
      : [
        [x - 1, y], [x + 1, y],
        [x - 1, y - 1], [x, y - 1],
        [x - 1, y + 1], [x, y + 1],
      ]
  }

  type Node = { x: number; y: number; d: number }
  const visited = new Set<string>([idxKey(wrapX(sx), sy)])
  const out = new Set<string>()
  const q: Node[] = [{ x: sx, y: sy, d: 0 }]

  while (q.length) {
    const cur = q.shift() as Node
    if (cur.d === dist) {
      if (!(cur.x === sx && cur.y === sy)) out.add(idxKey(wrapX(cur.x), cur.y))
      continue
    }
    for (const [nx, ny] of neighborCoords(cur.x, cur.y)) {
      if (ny < 0 || ny >= sizeY) continue // clamp Y
      const key = idxKey(wrapX(nx), ny)
      if (visited.has(key)) continue
      visited.add(key)
      q.push({ x: nx, y: ny, d: cur.d + 1 })
    }
  }

  return out
}

// Convert neighbors record to Set of "[x,y]" strings for comparison
const toIdxSet = (neighbors: Record<ObjKey, Tile>): Set<string> => {
  const s = new Set<string>()
  for (const t of Object.values(neighbors)) s.add(idxKey(t.x, t.y))
  return s
}
