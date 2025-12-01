import { Manager } from '@/managers/_manager'
import { Citizen, City, generateKey, Player, Tile, Unit, UnitDesign } from '@/objects/game/gameObjects'
import { CitizenManager } from '@/managers/citizenManager'
import { UnitManager } from '@/managers/unitManager'

export class CityManager extends Manager {
  create (tile: Tile, player: Player, name: string, citizenCount = 1): City {
    const city = new City(
      generateKey('city'),
      player.key,
      tile.key,
      name,
    )
    player.cityKeys.value.push(city.key)
    tile.cityKey.value = city.key

    const citizenManager = new CitizenManager()
    for (let i = 0; i < citizenCount; i++) {
      citizenManager.create(city)
    }

    this._objects.set(city)

    return city
  }

  giveTo (city: City, player: Player) {

  }

  levyUnit (city: City, citizen: Citizen): Unit {
    // Get the most expensive design that can levy
    const design = city.player.value.activeDesigns.value
      .filter(d => d.equipment.specials.filter(s => s === 'specialType:canLevy').length > 0)
      .sort((a, b) => a.productionCost - b.productionCost)[0] as UnitDesign | undefined

    if (!design) throw new Error('Cannot levy any designs')

    const unit = new UnitManager().create(
      city.player.value,
      design,
      city.tile.value,
      city,
      'levy'
    )

    new CitizenManager().delete(citizen)

    return unit
  }
}