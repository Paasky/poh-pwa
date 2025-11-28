import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeIsland } from '../../../../../src/factories/TerraGenerator/helpers/post-processors'

vi.mock('@/factories/TerraGenerator/helpers/tetris', () => ({
  // Include -1,0,+1 to test wrap-around behavior too
  Tetris: { randomOffsets: () => ([{ dx: -1, dy: 0 }, { dx: 0, dy: 0 }, { dx: 1, dy: 0 }]) }
}))

const land = { id: 'land', key: 'domainType:land' }
const water = { id: 'water', key: 'domainType:water' }
const hill = { id: 'hill' }
const flat = { id: 'flat' }
const grass = { id: 'terrainType:grass', key: 'terrainType:grass' }

const mkGen = () => {
  const tiles: Record<string, any> = {}
  const size = { x: 5, y: 5 }
  const getKey = (x: number, y: number) => `x${(x + size.x) % size.x},y${(Math.max(0, Math.min(size.y - 1, y)))}`
  const getTile = (x: number, y: number) => {
    const key = getKey(x, y)
    if (!tiles[key]) tiles[key] = {
      x: (x + size.x) % size.x,
      y: Math.max(0, Math.min(size.y - 1, y)),
      domain: water,
      climate: { id: 'temperate' },
      terrain: { id: 'ocean', key: 'terrainType:ocean' },
      elevation: flat,
      isSalt: false,
      isFresh: false,
      canChangeDomain: () => true,
    }
    return tiles[key]
  }
  return {
    size,
    regSize: size,
    regTiles: tiles,
    gameTiles: tiles,
    land,
    flat,
    hill,
    getTile,
    getLandTerrainFromClimate: () => grass,
  }
}

describe('makeIsland', () => {
  let gen: any
  beforeEach(() => {
    gen = mkGen()
  })

  it('converts eligible tiles to land with selected elevation (hillChance=1 -> hill)', () => {
    const cx = 2, cy = 2
    makeIsland(gen, cx, cy, 'game', 1)
    const t0 = gen.getTile(cx, cy, gen.size, gen.gameTiles)
    const tL = gen.getTile(cx - 1, cy, gen.size, gen.gameTiles)
    const tR = gen.getTile(cx + 1, cy, gen.size, gen.gameTiles)
    for (const t of [tL, t0, tR]) {
      expect(t.domain).toBe(land)
      expect(t.terrain).toBe(grass)
      expect(t.elevation).toBe(hill)
      expect(t.isFresh).toBe(false)
      expect(t.isSalt).toBe(false)
    }
  })

  it('wraps horizontally when centered at x=0 and 3-wide offsets are used', () => {
    const cx = 0, cy = 1
    makeIsland(gen, cx, cy, 'game', 0) // hillChance=0 -> flat
    // With offsets -1,0,+1 and wrap on X, tiles x=4,0,1 become land
    const leftWrap = gen.getTile(-1, cy, gen.size, gen.gameTiles)
    const center = gen.getTile(0, cy, gen.size, gen.gameTiles)
    const right = gen.getTile(1, cy, gen.size, gen.gameTiles)
    for (const t of [leftWrap, center, right]) {
      expect(t.domain).toBe(land)
      expect(t.terrain).toBe(grass)
      expect(t.elevation).toBe(flat)
    }
  })

  it('respects canChangeDomain=false and only updates area when allowed (no-op here)', () => {
    const cx = 2, cy = 2
    // Make a specific tile immutable
    const imm = gen.getTile(cx, cy, gen.size, gen.gameTiles)
    imm.canChangeDomain = () => false
    const before = { domain: imm.domain, terrain: imm.terrain, elevation: imm.elevation }
    makeIsland(gen, cx, cy, 'game', 1)
    // The center tile should remain unchanged
    expect(imm.domain).toBe(before.domain)
    expect(imm.terrain).toBe(before.terrain)
    expect(imm.elevation).toBe(before.elevation)
  })
})
