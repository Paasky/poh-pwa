import { beforeEach, describe, expect, it } from 'vitest'
import { crawlTiles } from '../../../../../src/factories/TerraGenerator/helpers/post-processors'
import { Tile } from '../../../../../src/objects/gameObjects'
import { initTestPinia, loadStaticData } from '../../../../_setup/pinia'

// Minimal tile object factory
const t = (x: number, y: number) => ({ key: Tile.getKey(x, y), x, y })

// Fake gen that returns neighbors per level (accepts coords with x,y)
const mkGen = () => {
  const tiles: Record<string, any> = {}
  const add = (tile: any) => {
    tiles[tile.key] = tile
    return tile
  }
  const N: Record<string, any[]> = {}
  const setN = (tile: any, ns: any[]) => { N[tile.key] = ns }
  const get = (tile: any) => N[tile.key] || []
  return {
    tiles,
    add,
    setN,
    getGameNeighbors: (coords: { x: number, y: number }) => get(tiles[Tile.getKey(coords.x, coords.y)]),
    getRegNeighbors: (coords: { x: number, y: number }) => get(tiles[Tile.getKey(coords.x, coords.y)]),
    getStratNeighbors: (coords: { x: number, y: number }) => get(tiles[Tile.getKey(coords.x, coords.y)]),
  }
}

describe('crawlTiles', () => {
  beforeEach(() => {
    initTestPinia()
    loadStaticData()
  })
  it('performs DFS over valid neighbors without cycles', () => {
    const gen = mkGen()
    const a = gen.add(t(0, 0))
    const b = gen.add(t(1, 0))
    const c = gen.add(t(2, 0))
    const d = gen.add(t(1, 1))
    // Graph: a - b - c ; b - d ; d - a (cycle)
    gen.setN(a, [b])
    gen.setN(b, [a, c, d])
    gen.setN(c, [b])
    gen.setN(d, [b, a])

    const seen = new Set<string>()
    const res = crawlTiles(gen as any, 'game', a as any, seen, () => true)
    // All reachable unique tiles visited
    expect(res.map(x => x.key).sort()).toEqual([a, b, c, d].map(x => x.key).sort())
  })

  it('respects isValid predicate (stops traversal into invalid neighbors)', () => {
    const gen = mkGen()
    const a = gen.add(t(0, 0))
    const b = gen.add(t(1, 0))
    const c = gen.add(t(2, 0))
    gen.setN(a, [b])
    gen.setN(b, [a, c])
    gen.setN(c, [b])

    const seen = new Set<string>()
    const res = crawlTiles(gen as any, 'reg', a as any, seen, (tile) => tile !== c)
    // c is invalid, so it should not be included and not traversed past
    expect(res.map(x => x.key).sort()).toEqual([a, b].map(x => x.key).sort())
  })

  it('crawls a 3x3 U-shape while skipping blocked tiles (1,0) and (1,1)', () => {
    const gen = mkGen()
    // Build 3x3 grid tiles
    const grid: any[] = []
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        grid.push(gen.add(t(x, y)))
      }
    }
    const key = (x: number, y: number) => Tile.getKey(x, y)
    const tile = (x: number, y: number) => gen.tiles[key(x, y)]
    // Define full 8-dir adjacency for all tiles
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const ns: any[] = []
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || ny < 0 || nx >= 3 || ny >= 3) continue
            ns.push(tile(nx, ny))
          }
        }
        gen.setN(tile(x, y), ns)
      }
    }

    const start = tile(0, 0)
    const seen = new Set<string>()
    const blocked = new Set([key(1, 0), key(1, 1)])
    const isValid = (tt: any) => !blocked.has(tt.key)
    const res = crawlTiles(gen as any, 'game', start as any, seen, isValid)

    const visited = new Set(res.map(r => r.key))
    // Should include U-shape around the blocked column (x=1)
    const expectedKeys = [
      key(0, 0), key(0, 1), key(0, 2),
      key(1, 2),
      key(2, 2), key(2, 1), key(2, 0),
    ]
    for (const k of expectedKeys) expect(visited.has(k)).toBe(true)
    // And must not include the blocked tiles
    expect(visited.has(key(1, 0))).toBe(false)
    expect(visited.has(key(1, 1))).toBe(false)
  })
})
