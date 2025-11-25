import { World } from '@/types/common'
import { UnitManager } from '@/managers/unitManager'
import { PlayerManager } from '@/managers/playerManager'
import { createWorld } from '@/factories/worldFactory'
import { Manager } from '@/managers/_manager'
import { CultureManager } from '@/managers/cultureManager'
import { UnitDesignPrototype } from '@/objects/player'
import { UnitDesignManager } from '@/managers/unitDesignManager'

export type WorldSize = {
  name: string
  x: number
  y: number
  continents: 4 | 5 | 6 | 7 | 8 | 9 | 10
  majorsPerContinent: 1 | 2 | 3 | 4
  minorsPerPlayer: 0 | 1 | 2
}

export const worldSizes: WorldSize[] = [
  { name: 'Tiny', x: 72, y: 36, continents: 4, majorsPerContinent: 1, minorsPerPlayer: 0 },
  { name: 'Small', x: 120, y: 60, continents: 4, majorsPerContinent: 2, minorsPerPlayer: 2 },
  { name: 'Regular', x: 168, y: 84, continents: 5, majorsPerContinent: 3, minorsPerPlayer: 2 },
  { name: 'Large', x: 208, y: 104, continents: 6, majorsPerContinent: 4, minorsPerPlayer: 2 },
  { name: 'Huge', x: 264, y: 132, continents: 10, majorsPerContinent: 4, minorsPerPlayer: 2 },
]

export class WorldManager extends Manager {
  create (): World {
    console.time('world')
    const designManager = new UnitDesignManager()
    const playerManager = new PlayerManager()
    const unitManager = new UnitManager()

    const worldBundle = createWorld()
    Object.assign(this._objects.world, worldBundle.world)
    console.log('world', new Date())

    console.log('Got tiles', new Date())
    this._objects.bulkSet(worldBundle.tiles)
    console.log('Set tiles', new Date())

    // Create common unit designs
    const tribeDesign = designManager.create(new UnitDesignPrototype(null,
      this._objects.getTypeObject('platformType:human'),
      this._objects.getTypeObject('equipmentType:tribe'),
    ))
    const workerDesign = designManager.create(new UnitDesignPrototype(null,
      this._objects.getTypeObject('platformType:human'),
      this._objects.getTypeObject('equipmentType:worker'),
    ))
    const hunterDesign = designManager.create(new UnitDesignPrototype(null,
      this._objects.getTypeObject('platformType:human'),
      this._objects.getTypeObject('equipmentType:javelin'),
    ))
    const warbandDesign = designManager.create(new UnitDesignPrototype(null,
      this._objects.getTypeObject('platformType:human'),
      this._objects.getTypeObject('equipmentType:spear'),
    ))
    console.log('Created unit designs', new Date())

    // Get random region
    const regions = this._objects.getClassTypes('regionType')
    const region = regions[Math.floor(Math.random() * regions.length)]

    // Get two random major cultures from the region
    const cultureManager = new CultureManager()
    const rand = Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4
    const cultures = [
      cultureManager.getMajorTypeForRegion(region, rand),
      cultureManager.getMajorTypeForRegion(region, rand < 4 ? rand + 1 as 1 | 2 | 3 | 4 : 0),
    ]

    for (let i = 0; i < 2; i++) {
      const player = playerManager.create('Player ' + (i + 1), cultures[i], i === 0)
      if (player.isCurrent) this._objects.world.currentPlayer = player.key
      console.log('Created player', new Date())

      player.unitDesigns.push(
        workerDesign.key,
        hunterDesign.key,
        warbandDesign.key,
      )

      const tile = worldBundle.tiles[Math.floor(Math.random() * worldBundle.tiles.length)]
      unitManager.create(player, tribeDesign, tile)
      unitManager.create(player, hunterDesign, tile)
      console.log('Created player units', new Date())

      playerManager.calcTiles(player)
      console.log('Calculated tiles', new Date())
    }

    return worldBundle.world
  }

  static mapConfig () {
    return {
      continents: { min: 4, max: 10 },
      majorsPerContinent: { min: 1, max: 4 },
      minorsPerPlayer: { min: 0, max: 2 },

      // x & y size to fit everyone on land, plus the same amount of water
      getSize: (continents: 4 | 5 | 6 | 7 | 8 | 9 | 10, majorsPerContinent: 1 | 2 | 3 | 4, minorsPerPlayer: 0 | 1 | 2): WorldSize => {
        // City area = 61 (4-radius)
        // 5 cities per major + 1 per minor
        // * 2 for oceans
        // = 2440 to 34 160 tiles
        const majors = majorsPerContinent * continents
        const minors = majors * minorsPerPlayer
        const cities = (majors * 5) + minors
        const minSize = 61 * cities * 2

        // Find a map x & y that fits the min size (x increments by 8)
        // Start with the smallest size 72x36 = 2 592 tiles up to 264x132 = 34 848 tiles
        let xSize = 72
        while (true) {
          if (xSize * (xSize / 2) >= minSize) return {
            name: 'Custom',
            x: xSize,
            y: xSize / 2,
            continents,
            majorsPerContinent,
            minorsPerPlayer,
          }
          xSize = xSize + 8
        }
      },

      // Very rough estimate of memory usage for a given map size
      getMemReq: (continents: 4 | 5 | 6 | 7 | 8 | 9 | 10, majorsPerContinent: 1 | 2 | 3 | 4, minorsPerPlayer: 0 | 1 | 2): {
        minMB: number,
        maxMB: number,
        cpuImpact: 1 | 2 | 3 | 4 | 5
      } => {
        const majors = majorsPerContinent * continents
        const minors = majors * minorsPerPlayer
        const cities = (majors * 5) + minors
        const tiles = 61 * cities * 2
        const citizens = cities * 50
        const constructions = cities * 20
        const players = majors + minors
        const religions = Math.ceil(majors / 2)
        const units = players * 25
        const unitDesigns = players * 10

        const watchers = tiles * 4
          + players * (8 + 6 + 12 + 2)
          + cities * 9
          + citizens * 9
          + constructions * 5
          + units * 9
          + unitDesigns * 2
          + religions * 4

        const refs = tiles * 5
          + players * (6 + 6 + 5 + 5)
          + cities * 9
          + citizens * 7
          + constructions * 7
          + units * 7
          + unitDesigns * 2
          + religions * 3

        const staticData = 7 * 1024 * 1024

        const minMB = Math.round((watchers * 256 + refs * 64 + staticData) / (1024 * 1024))
        const maxMB = Math.round((watchers * 1024 + refs * 512 + staticData) / (1024 * 1024))

        return {
          minMB,
          maxMB,
          cpuImpact: Math.min(5, Math.ceil(maxMB / 100)) as 1 | 2 | 3 | 4 | 5,
        }
      }
    }
  }
}