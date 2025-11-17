import { World } from '@/types/common'
import { UnitDesignManager } from '@/managers/unitDesignManager'
import { UnitManager } from '@/managers/unitManager'
import { PlayerManager } from '@/managers/playerManager'
import { createWorld } from '@/factories/worldFactory'
import { Manager } from '@/managers/_manager'
import { CultureManager } from '@/managers/cultureManager'

export class WorldManager extends Manager {
  create (): World {
    const designManager = new UnitDesignManager()
    const playerManager = new PlayerManager()
    const unitManager = new UnitManager()

    const world = createWorld()
    Object.assign(this._objects.world, world)
    console.log('Created world:', world)

    /*
    const tiles = Object.values(world.tiles)
    this._objects.bulkSet(tiles)
    console.log('Created tiles:', tiles)

    const tribeDesign = designManager.create(
      this._objects.getTypeObject('equipmentType:tribe'),
      this._objects.getTypeObject('platformType:human'),
    )
    const hunterDesign = designManager.create(
      this._objects.getTypeObject('equipmentType:javelin'),
      this._objects.getTypeObject('platformType:human'),
    )
    console.log('Created unit designs:', tribeDesign, hunterDesign)
    */

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
      console.log('Created player:', player)

      /*
      player.unitDesigns.push(
        tribeDesign.key,
        hunterDesign.key
      )

      const tile = tiles[Math.floor(Math.random() * tiles.length)]
      player.units.push(
        unitManager.create(player, tribeDesign, tile).key,
        unitManager.create(player, hunterDesign, tile).key,
      )
      console.log('Created player units:', player.units)

      playerManager.calcTiles(player)
      console.log('Calculated tiles')
      */
    }

    return world
  }
}