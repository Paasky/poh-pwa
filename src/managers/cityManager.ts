import { Manager } from '@/managers/_manager'
import { City, Player, Tile, Unit } from '@/types/gameObjects'

export class CityManager extends Manager {
  addCitizen (city: City) {

  }

  addTile (city: City, tile: Tile) {

  }

  automateBorders (city: City, isEnabled = true) {

  }

  automateCitizens (city: City, isEnabled = true) {

  }

  automateProduction (city: City, isEnabled = true) {

  }

  calcActions (city: City) {

  }

  calcCanProduce (city: City) {

  }

  calcQueues (city: City) {

  }

  calcYields (city: City) {

  }

  create (): City {

  }

  giveTo (city: City, player: Player) {

  }

  levyUnit (city: City): Unit {

  }

  modifyHealth (city: City, amount: number) {

  }

  startTurn (city: City) {

  }
}