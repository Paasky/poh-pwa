import { useObjectsStore } from '@/stores/objectStore'
import { Player } from '@/types/gameObjects'
import { createPlayer, PlayerBundle } from '@/factories/playerFactory'
import { Manager } from '@/managers/_manager'

export class PlayerManager extends Manager {
  create (
    name = '',
    isCurrent = false,
  ): Player {
    const playerBundle = createPlayer(name, isCurrent) as PlayerBundle
    this._objects.bulkSet([playerBundle.player, playerBundle.culture])
    return playerBundle.player
  }

  calcTiles(player: Player): void {
  }
}