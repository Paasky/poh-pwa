import { TerraGenerator } from '@/factories/TerraGenerator/terra-generator'
import { getRandom, takeRandom } from '@/helpers/arrayTools'
import { Tile } from '@/objects/gameObjects'
import { makeIsland, mountainRange, removeOrphanArea } from '@/factories/TerraGenerator/helpers/post-processors'
import { GenTile } from '@/factories/TerraGenerator/gen-tile'
import { getNeighborCoords } from '@/factories/TerraGenerator/helpers/neighbors'

export class RegLevel {
  gen: TerraGenerator

  constructor (gen: TerraGenerator) {
    this.gen = gen
  }

  fillFromStrat (): RegLevel {
    for (let y = 0; y < this.gen.regSize.y; y++) {
      for (let x = 0; x < this.gen.regSize.x; x++) {
        // Choose a random stratLevel neighbor
        const neighborCoords = getNeighborCoords({ x, y }, this.gen.regSize, 'manhattan', 1)
        const stratNeighbors = neighborCoords.map(c => this.gen.getStratFromRegCoords(c.x, c.y))
        const strat = getRandom(stratNeighbors)

        // Allow a 25% chance for elevation swap for extra variety
        const elevation = strat.domain === this.gen.land && Math.random() < 0.25
          ? (strat.elevation === this.gen.flat ? this.gen.hill : this.gen.flat)
          : strat.elevation

        const tile = new GenTile(
          x,
          y,
          strat.domain,
          strat.area,
          strat.climate,
          strat.terrain,
          elevation,
        )

        const distToPole = this.gen.getDistToPole(y, this.gen.regSize.y)
        tile.feature.value = this.gen.getFeatureForTile(tile, distToPole) as any
        this.gen.regTiles[Tile.getKey(x, y)] = tile
      }
    }

    return this
  }

  postProcess (): RegLevel {
    // Clean orphaned areas
    for (let y = 0; y < this.gen.regSize.y; y++) {
      for (let x = 0; x < this.gen.regSize.x; x++) {
        const key = Tile.getKey(x, y)
        const tile = this.gen.regTiles[key]
        if (!tile) throw new Error(`regTile[${key}] does not exist`)

        const neighbors = this.gen.getRegNeighbors({ x, y }, 'manhattan')
        removeOrphanArea(tile, neighbors)
      }
    }

    // Find large blobs of Sea: add random tetris-shape of land
    for (let y = 0; y < this.gen.regSize.y; y++) {
      for (let x = 0; x < this.gen.regSize.x; x++) {
        const key = Tile.getKey(x, y)
        const tile = this.gen.regTiles[key]!
        if (tile.terrain !== this.gen.seaTerrain) continue

        const neighbors = this.gen.getRegNeighbors({ x, y }, 'manhattan', 3)
        const allAreSameTerrain = neighbors.every(n => n.terrain === tile.terrain)

        if (!allAreSameTerrain) continue

        // Generate a small "tetris"-like island in a 2x2 or 3x3 footprint
        // Prefer hill elevation for sea islands
        makeIsland(this.gen, x, y, 'reg', 0.75)
      }
    }

    const landTilesPerContinent: Record<string, Record<string, GenTile>> = {}
    for (const tile of Object.values(this.gen.regTiles)) {
      if (tile.domain !== this.gen.land) continue

      if (!landTilesPerContinent[tile.area.key]) {
        landTilesPerContinent[tile.area.key] = {}
      }
      landTilesPerContinent[tile.area.key][tile.key] = tile
    }
    for (const continent of Object.values(this.gen.continents)) {
      // Add starts per continent
      for (const stratStartTile of continent.majorStarts.strat) {
        const startTile = getRandom(
          this.gen.getRegTilesFromStratCoords(stratStartTile.x, stratStartTile.y).filter(t => t.domain === this.gen.land)
        )
        startTile.isStart = 'major'
        continent.majorStarts.reg.push(startTile)

        // Reserved as a start -> remove from landTilesPerContinent
        delete landTilesPerContinent[startTile.area.key][startTile.key]
      }

      // Add 3 mountain ranges per continent
      const landTiles = Object.values(landTilesPerContinent[continent.type.key])
      for (let i = 0; i < 3; i++) {
        const rangeStart = takeRandom(landTiles)
        const mountainTiles = mountainRange(
          rangeStart,
          this.gen.regTiles,
          this.gen.regSize,
        )

        // Flat Mountain neighbors have a 50% chance of becoming hill
        for (const tile of mountainTiles) {
          for (const neighbor of this.gen.getRegNeighbors(tile, 'manhattan')) {
            // Skip non-lake water
            if (neighbor.domain === this.gen.water && neighbor.terrain !== this.gen.lakeTerrain) continue

            if (neighbor.elevation === this.gen.flat && Math.random() < 0.5) neighbor.elevation = this.gen.hill
          }
        }
      }
    }

    return this
  }
}