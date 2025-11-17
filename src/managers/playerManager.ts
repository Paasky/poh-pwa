import { Player } from '@/types/gameObjects'
import { createPlayer, PlayerBundle } from '@/factories/playerFactory'
import { Manager } from '@/managers/_manager'
import { TypeObject } from '@/types/typeObjects'

export class PlayerManager extends Manager {
  create (
    name: string,
    cultureType: TypeObject,
    isCurrent = false,
  ): Player {
    const playerBundle = createPlayer(name, cultureType, isCurrent) as PlayerBundle
    this._objects.bulkSet([playerBundle.player, playerBundle.culture])
    return playerBundle.player
  }

  calcTiles (player: Player): void {
  }
}