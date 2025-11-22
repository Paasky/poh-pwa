import { Manager } from '@/managers/_manager'
import { Citizen, City, Player, Tile, Unit, UnitDesign } from '@/types/gameObjects'
import { CitizenManager } from '@/managers/citizenManager'
import { TileManager } from '@/managers/tileManager'
import { UnitManager } from '@/managers/unitManager'

export class CityManager extends Manager {
  addCitizen (city: City) {

  }

  addTile (city: City, tile: Tile) {
    tile.player = city.player
    const player = this._objects.getGameObject(city.player) as Player
    new TileManager().calcStatic(tile)
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

  create (tile: Tile, player: Player, name: string, citizenCount = 1): City {
    const city = {} as City
    const citizenManager = new CitizenManager()
    for (let i = 0; i < citizenCount; i++) {
      citizenManager.create(city)
    }
    return city
  }

  giveTo (city: City, player: Player) {

  }

  levyUnit (city: City, citizen: Citizen): Unit {
    const player = this._objects.getGameObject(city.player) as Player

    // get unit design that can be levied with the highest strength
    const designs = player.unitDesigns.map(d => this._objects.getGameObject(d) as UnitDesign)
      .filter(d => d.specials.filter(s => s.id === 'canLevy').length > 0)

    const unit = new UnitManager().create(
      player,
      designs[0],
      this._objects.getGameObject(city.tile) as Tile,
      citizen
    )

    new CitizenManager().delete(citizen)

    return unit
  }

  modifyHealth (city: City, amount: number) {

  }

  startTurn (city: City) {

  }
}