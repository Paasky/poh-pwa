import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock store to allow creating and retrieving the River object
const storeMap = new Map<string, any>()
vi.mock('@/stores/objectStore', () => ({
  useObjectsStore: () => ({
    set: (obj: any) => { storeMap.set(obj.key, obj) },
    get: (key: string) => storeMap.get(key),
    getTypeObject: (k: string) => ({ key: k }),
    getClassTypes: () => [],
  })
}))

// Mock gameObjects: River class and generateKey
vi.mock('@/objects/gameObjects', () => ({
  River: class River {
    key: string
    tileKeys = { value: [] as string[] }
    constructor (key: string) { this.key = key }
  },
  generateKey: (p: string) => `${p}:1`,
}))

// Mock snake to traverse a simple path and invoke onVisit
vi.mock('@/factories/TerraGenerator/helpers/snake', () => ({
  snake: (
    start: any,
    _tiles: Record<string, any>,
    walked: any[],
    _size: any,
    _lengths: any,
    _turns: any,
    accept: (t: any) => boolean | 'blocked',
    _dir: any,
    onVisit: (t: any) => void,
  ) => {
    const route = [start, { ...start, x: start.x + 1, y: start.y, key: `k${start.x + 1},${start.y}` }, { ...start, x: start.x + 2, y: start.y, key: `k${start.x + 2},${start.y}` }]
    for (const tile of route) {
      const ok = accept(tile)
      if (ok === true) {
        walked.push(tile)
        onVisit(tile)
      } else if (ok === false) {
        break
      }
    }
  }
}))

import { river } from '../../../../../src/factories/TerraGenerator/helpers/post-processors'

describe('river', () => {
  let gen: any
  let tiles: Record<string, any>
  beforeEach(() => {
    tiles = {}
    // Create three in-line tiles and one neighbor for freshness test
    const a = { x: 0, y: 0, key: 'k0,0', isSalt: false, elevation: { key: 'elevationType:flat' } }
    const b = { x: 1, y: 0, key: 'k1,0', isSalt: false, elevation: { key: 'elevationType:flat' } }
    const c = { x: 2, y: 0, key: 'k2,0', isSalt: false, elevation: { key: 'elevationType:flat' } }
    const n = { x: 1, y: 1, key: 'k1,1', isFresh: false }
    tiles[a.key] = a
    tiles[b.key] = b
    tiles[c.key] = c
    tiles[n.key] = n

    gen = {
      regTiles: tiles,
      gameTiles: tiles,
      regSize: { x: 10, y: 10 },
      size: { x: 10, y: 10 },
      getGameNeighbors: (x: number, y: number) => {
        const key = `k${x},${y}`
        if (key === 'k1,0') return [tiles['k1,1']]
        return []
      },
      getRegNeighbors: (x: number, y: number) => [],
    }
  })

  it('creates a River, marks walked tiles and freshens neighbors', () => {
    const start = tiles['k0,0']
    const r = river(gen, start, 'game')
    expect(r).toBeTruthy()
    // Walked tiles are 3 (from mock snake route)
    expect(r.tileKeys.value.length).toBe(3)
    for (const key of r.tileKeys.value) {
      const t = tiles[key]
      expect(t.riverKey).toBe(r.key)
      expect(t.isFresh).toBe(true)
    }
    // Neighbor of middle tile should be set fresh in finalize loop
    expect(tiles['k1,1'].isFresh).toBe(true)
  })

  it('stops when reaching salt water', () => {
    // Modify snake mock to approach a salt tile at step 2
    const a = { x: 0, y: 0, key: 'k0,0', isSalt: false, elevation: { key: 'elevationType:flat' } }
    const b = { x: 1, y: 0, key: 'k1,0', isSalt: true, elevation: { key: 'elevationType:flat' } }
    const tiles2: Record<string, any> = { [a.key]: a, [b.key]: b }
    const gen2 = {
      regTiles: tiles2,
      gameTiles: tiles2,
      regSize: { x: 10, y: 10 },
      size: { x: 10, y: 10 },
      getGameNeighbors: (_x: number, _y: number) => [],
      getRegNeighbors: (_x: number, _y: number) => [],
    }
    const r = river(gen2 as any, a as any, 'game')
    // Because accept should return false on salt, walked length must be <=1
    expect(r.tileKeys.value.length).toBeLessThanOrEqual(1)
  })

  it('marks other river downstream as major when merging', () => {
    // Build an existing river whose path includes the confluence tile 'k2,0'
    const existing = ['k2,0', 'k3,0', 'k4,0']
    for (const k of existing) {
      const [x, y] = k.slice(1).split(',').map(Number)
      tiles[k] = { ...(tiles[k] || {}), key: k, x, y, isFresh: true, riverKey: 'river:existing' }
    }
    // Put the existing river object in the store via mocked storeMap
    const otherRiver = { key: 'river:existing', tileKeys: { value: existing.slice() } }
    storeMap.set(otherRiver.key, otherRiver)

    // Our mocked snake goes k0,0 -> k1,0 -> k2,0
    // Ensure k2,0 is tagged as existing river so accept returns false and we merge
    tiles['k2,0'].riverKey = 'river:existing'

    const r = river(gen as any, tiles['k0,0'] as any, 'game')
    expect(r.tileKeys.value.length).toBeGreaterThan(0)
    // After confluence at k2,0, other river from that tile onwards should be marked as major
    const startIdx = otherRiver.tileKeys.value.indexOf('k2,0')
    for (let i = startIdx; i < otherRiver.tileKeys.value.length; i++) {
      const tk = otherRiver.tileKeys.value[i]
      expect(tiles[tk].isMajorRiver).toBe(true)
    }
  })

  it('continues through lakes (not stopping on lake terrain/domain)', () => {
    // Make middle tile a lake, not salt, and ensure it is still accepted by accept callback
    tiles['k1,0'].terrain = { id: 'lake' }
    const r = river(gen as any, tiles['k0,0'] as any, 'game')
    expect(r.tileKeys.value.length).toBe(3)
  })
})
