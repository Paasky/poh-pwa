import { Manager } from '@/managers/_manager'
import { Citizen, City, Culture, Religion, Tile } from '@/types/gameObjects'
import { TypeObject } from '@/types/typeObjects'

export class CitizenManager extends Manager {
  calcYields (citizen: Citizen) {

  }

  create (city: City): Citizen {
    const citizen = {} as Citizen
    city.citizens.push(citizen.key)
    return citizen
  }

  delete (citizen: Citizen) {

  }

  setCulture (citizen: Citizen, culture: Culture) {

  }

  setPolicy (citizen: Citizen, policy: TypeObject) {

  }

  setReligion (citizen: Citizen, religion: Religion) {

  }

  setTile (citizen: Citizen, tile: Tile) {

  }
}