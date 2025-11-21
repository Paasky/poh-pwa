import { Manager } from '@/managers/_manager'
import { TypeObject } from '@/types/typeObjects'
import { City, Player, Tile, WorldWonder } from '@/types/gameObjects'
import { GameKey } from '@/types/common'

export class WonderManager extends Manager {
  create (type: TypeObject, tile: Tile, city: City): WorldWonder {
    const wonder = {
      tile: tile.key,
      type,
      health: number,
      citizen?: GameKey,
    } as WorldWonder
  }

  createPending (type: TypeObject, tile: Tile, city: City) {
    // todo: log this wonder could be complete this round
  }

  start (type: TypeObject, tile: Tile, city: City) {
    // todo: check city can start wonder
    // todo: create a Construction with the wonder on the tile with progress 0
  }
}