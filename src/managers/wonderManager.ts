import { Manager } from '@/managers/_manager'
import { TypeObject } from '@/types/typeObjects'
import { City, Tile, WorldWonder } from '@/objects/gameObjects'

export class WonderManager extends Manager {
  create (type: TypeObject, tile: Tile, city: City): WorldWonder {
    return {
      tile: tile.key,
      type,
      health: 0,
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