import { useObjectsStore } from '@/stores/objectStore'
import { World } from '@/types/common'
import { UnitDesignManager } from '@/managers/unitDesignManager'
import { UnitManager } from '@/managers/unitManager'
import { PlayerManager } from '@/managers/playerManager'
import { createWorld } from '@/factories/worldFactory'
import { Manager } from '@/managers/_manager'

export class WorldManager extends Manager {
  create (): World {
    const designManager = new UnitDesignManager()
    const playerManager = new PlayerManager()
    const unitManager = new UnitManager()

    const playerCount = 2

    const world = createWorld()
    this._objects.world = world

    const tiles = Object.values(world.tiles)
    this._objects.bulkSet(tiles)

    const tribeDesign = designManager.create(
        this._objects.getTypeObject('equipmentType:tribe'),
        this._objects.getTypeObject('platformType:human'),
      )
    const hunterDesign = designManager.create(
      this._objects.getTypeObject('equipmentType:javelin'),
      this._objects.getTypeObject('platformType:human'),
    )

    for (let i = 0; i < playerCount; i++) {
      const tile = tiles[Math.floor(Math.random() * tiles.length)]

      const player = playerManager.create('Player ' + (i + 1), i === 0)
      if (player.isCurrent) world.currentPlayer = player.key

      player.unitDesigns.push(
        tribeDesign.key,
        hunterDesign.key
      )
      player.units.push(
        unitManager.create(player, tribeDesign, tile).key,
        unitManager.create(player, hunterDesign, tile).key,
      )

      playerManager.calcTiles(player)
    }

    return world
  }
}