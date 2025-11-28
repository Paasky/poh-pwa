import { TerraGenerator } from '@/factories/TerraGenerator/terra-generator'
import { getRandom, takeRandom } from '@/helpers/arrayTools'
import { GenTile } from '@/factories/TerraGenerator/gen-tile'
import { Tile } from '@/objects/gameObjects'
import {
  makeIsland,
  removeOrphanArea,
  removeOrphanTerrain,
  river,
  spreadSalt
} from '@/factories/TerraGenerator/helpers/post-processors'
import { getNeighborCoords } from '@/factories/TerraGenerator/helpers/neighbors'

export class GameLevel {
  gen: TerraGenerator

  constructor (gen: TerraGenerator) {
    this.gen = gen
  }

  fillFromReg (): GameLevel {
    for (let y = 0; y < this.gen.size.y; y++) {
      for (let x = 0; x < this.gen.size.x; x++) {
        // Choose a random regLevel neighbor
        const neighborCoords = getNeighborCoords(this.gen.size, { x, y }, 'manhattan', 1)
        const regNeighbors = neighborCoords.map(c => this.gen.getRegFromGameCoords(c.x, c.y))
        const regTile = getRandom(regNeighbors)

        // Allow a 25% chance for elevation swap for extra variety
        let elevation = regTile.domain === this.gen.land && Math.random() < 0.25
          ? (regTile.elevation === this.gen.flat ? this.gen.hill : this.gen.flat)
          : regTile.elevation

        // Force water-domain tiles to be flat for gameplay readability
        if (regTile.domain === this.gen.water) elevation = this.gen.flat

        const tile = new GenTile(
          x,
          y,
          regTile.domain,
          regTile.area,
          regTile.climate,
          regTile.terrain,
          elevation,
          regTile.feature.value as any
        )

        // Allow a 25% chance for feature swap for extra variety
        if (Math.random() < 0.25) {
          regTile.feature.value = regTile.feature.value
            // Had a feature -> swap to empty
            ? null

            // Didn't have a feature -> add one
            : this.gen.getFeatureForTile(
              tile,
              this.gen.getDistToPole(y, this.gen.size.y)
            )
        }

        this.gen.gameTiles[Tile.getKey(x, y)] = tile
      }
    }

    return this
  }

  // todo:
  // for orphan terrain, add bool "ignoreLakes = true", so lake/land is not modified
  // for oasis, if reg has one, give it to a random game tile in the group of 9
  // for atolls, if reg has one:
  // - 50% chance of center game tile as flat island
  // - 50% chance of tetris-shape hill island tiles
  // - keep existing feature-chance for other game tiles
  // for sea, if has 3-dist manhattan area of all same terrain
  // - add tetris-shape hill island
  // for lake, if has 3-dist manhattan area of all same terrain
  // - add tetris-shape flat island
  postProcess (): GameLevel {
    for (let y = 0; y < this.gen.size.y; y++) {
      for (let x = 0; x < this.gen.size.x; x++) {
        const key = Tile.getKey(x, y)
        const tile = this.gen.gameTiles[key]
        if (!tile) throw new Error(`gameTile[${key}] does not exist`)

        // Precompute neighbors once per tile for (distance 1 neighbors)
        const n1 = this.gen.getGameNeighbors({ x, y }, 'manhattan')
        removeOrphanArea(tile, n1)
        removeOrphanTerrain(tile, n1)

        // Island generation in uniform water patches (distance 3 neighbors)
        if (tile.terrain === this.gen.seaTerrain || tile.terrain === this.gen.lakeTerrain) {
          // Only check 10% of the time
          if (Math.random() < 0.1) {
            const n3 = this.gen.getGameNeighbors({ x, y }, 'manhattan', 3)
            if (n3.length && n3.every(n => n.terrain === tile.terrain)) {
              if (tile.terrain === this.gen.seaTerrain) {
                // Prefer hill islands in seas
                makeIsland(this.gen, x, y, 'game', 0.75)
              } else {
                // Prefer flat islands in lakes
                makeIsland(this.gen, x, y, 'game', 0.25)
              }
            }
          }
        }

        // Handle oasis/atoll transfer at centers of 3x3 game blocks per reg tile
        if (x % 3 === 1 && y % 3 === 1) {
          const reg = this.gen.getRegFromGameCoords(x, y)
          const f = reg.feature.value as any
          if (f && f.class === 'featureType') {
            if (f.id === 'oasis') {
              const group = this.gen.getGameTilesFromRegCoords(reg.x, reg.y)
              const rnd = getRandom(group)
              rnd.feature.value = f
            } else if (f.id === 'atoll') {
              if (Math.random() < 0.5) {
                // Center flat island
                tile.domain = this.gen.land
                tile.terrain = this.gen.getLandTerrainFromClimate(tile.climate)
                tile.elevation = this.gen.flat
                tile.isFresh = false
                tile.isSalt = false
              } else {
                // Tetris-shaped island, prefer hills
                makeIsland(this.gen, x, y, 'game', 0.75)
              }
            }
          }
        }
      }
    }

    // 1) Spread salt: mark all water connected to the polar borders as salt water (oceanic)
    //    X wraps, Y is clamped, so only top/bottom rows are true outer oceans.
    //    Clear previous salt/fresh flags on water first, then flood from edges.
    for (let y = 0; y < this.gen.size.y; y++) {
      for (let x = 0; x < this.gen.size.x; x++) {
        const t = this.gen.gameTiles[Tile.getKey(x, y)]!
        if (t.domain === this.gen.water) {
          t.isSalt = false
          // do not decide terrain yet; we'll recalc below
        }
      }
    }

    // Seed from top and bottom rows
    const lastY = this.gen.size.y - 1
    for (let x = 0; x < this.gen.size.x; x++) {
      const top = this.gen.gameTiles[Tile.getKey(x, 0)]!
      const bot = this.gen.gameTiles[Tile.getKey(x, lastY)]!
      if (top.domain === this.gen.water) spreadSalt(this.gen, 'game', top)
      if (bot.domain === this.gen.water) spreadSalt(this.gen, 'game', bot)
    }

    // 2) Baseline water terrains
    //    - Non-salt water becomes Lake
    //    - Salt water becomes Ocean (will convert to Coast/Sea in next steps)
    for (let y = 0; y < this.gen.size.y; y++) {
      for (let x = 0; x < this.gen.size.x; x++) {
        const t = this.gen.gameTiles[Tile.getKey(x, y)]!
        if (t.domain !== this.gen.water) continue
        if (t.isSalt) {
          t.terrain = this.gen.oceanTerrain
          t.isFresh = false
        } else {
          t.terrain = this.gen.lakeTerrain
          t.isFresh = true
        }
      }
    }

    // 3) All salt water next to land -> Coast
    for (let y = 0; y < this.gen.size.y; y++) {
      for (let x = 0; x < this.gen.size.x; x++) {
        const t = this.gen.gameTiles[Tile.getKey(x, y)]!
        if (t.domain !== this.gen.water || !t.isSalt) continue
        const n = this.gen.getGameNeighbors({ x, y })
        if (n.some(nn => nn.domain === this.gen.land)) {
          t.terrain = this.gen.coastTerrain
        }
      }
    }

    // 4) All Ocean next to Coast -> Sea
    for (let y = 0; y < this.gen.size.y; y++) {
      for (let x = 0; x < this.gen.size.x; x++) {
        const t = this.gen.gameTiles[Tile.getKey(x, y)]!
        if (t.domain !== this.gen.water) continue
        if (t.terrain !== this.gen.oceanTerrain) continue
        const n = this.gen.getGameNeighbors({ x, y })
        if (n.some(nn => nn.terrain === this.gen.coastTerrain)) {
          t.terrain = this.gen.seaTerrain
        }
      }
    }

    // 5) River generation: 3 rivers per continent
    for (const continent of Object.values(this.gen.continents)) {
      // Collect candidate land tiles on this continent
      const candidates: GenTile[] = []
      for (const t of Object.values(this.gen.gameTiles)) {
        if (t.domain === this.gen.land && t.area?.key === continent.type.key) {
          candidates.push(t)
        }
      }
      // Try to start 3 rivers; if too few candidates, start as many as possible
      for (let i = 0; i < 3 && candidates.length > 0; i++) {
        const start = takeRandom(candidates)
        // Skip tiles that are adjacent to salt water to avoid trivial rivers
        const neighs = this.gen.getGameNeighbors(start)
        if (neighs.some(nn => nn.domain === this.gen.water && nn.isSalt)) {
          i--
          continue
        }
        river(this.gen, start, 'game')
      }
    }
    return this
  }
}