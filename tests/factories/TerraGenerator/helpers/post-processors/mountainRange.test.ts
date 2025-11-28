import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock useObjectsStore to return elevation objects
vi.mock('@/stores/objectStore', () => ({
  useObjectsStore: () => ({
    getTypeObject: (key: string) => ({ key }),
  })
}))

// Mock snake to iterate a simple route and honor accept return value
vi.mock('@/factories/TerraGenerator/helpers/snake', () => ({
  snake: (
    start: any,
    tiles: Record<string, any>,
    walked: any[],
    _size: any,
    _lengths: any,
    _turns: any,
    accept: (t: any) => boolean | 'blocked',
  ) => {
    const route = [
      start,
      tiles['x1,y0'], // water
      tiles['x2,y0'], // water (after this, waterCount hits 2)
      tiles['x3,y0'], // water (should stop when waterCount reaches 3)
    ]
    for (const t of route) {
      const res = accept(t)
      if (res === true) {
        walked.push(t)
      } else if (res === false) {
        break
      } else if (res === 'blocked') {
        // skip pushing, but continue
      }
    }
  }
}))

import { mountainRange } from '../../../../../src/factories/TerraGenerator/helpers/post-processors'

describe('mountainRange', () => {
  let tiles: Record<string, any>
  let start: any
  beforeEach(() => {
    tiles = {
      'x0,y0': { x: 0, y: 0, domain: { id: 'land' }, terrain: { id: 'grass' }, elevation: { key: 'elevationType:flat' } },
      'x1,y0': { x: 1, y: 0, domain: { id: 'water' }, terrain: { id: 'ocean' } },
      'x2,y0': { x: 2, y: 0, domain: { id: 'water' }, terrain: { id: 'ocean' } },
      'x3,y0': { x: 3, y: 0, domain: { id: 'water' }, terrain: { id: 'ocean' } },
    }
    start = tiles['x0,y0']
  })

  it('raises elevations along path until water limit hit and returns walked tiles', () => {
    const walked = mountainRange(start, tiles as any, { x: 10, y: 10 })
    // Start land tile + first two water tiles get accepted; third water stops
    expect(walked.length).toBe(3)
    expect(['elevationType:mountain', 'elevationType:snowMountain']).toContain((walked[0].elevation.key))
    // Water tiles should remain water (no elevation change asserted)
  })
})
