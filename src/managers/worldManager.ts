import { World } from '@/types/common'
import { UnitManager } from '@/managers/unitManager'
import { PlayerManager } from '@/managers/playerManager'
import { createWorld } from '@/factories/worldFactory'
import { Manager } from '@/managers/_manager'
import { CultureManager } from '@/managers/cultureManager'
import { UnitDesignPrototype } from '@/objects/player'
import { UnitDesignManager } from '@/managers/unitDesignManager'

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
}