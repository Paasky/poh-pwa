import { Manager } from '@/managers/_manager'
import { Citizen, City, generateKey, Tile } from '@/objects/gameObjects'

export class CitizenManager extends Manager {
  create (city: City, tile?: Tile): Citizen {
    const citizen = new Citizen(
      generateKey('citizen'),
      city.key,
      city.player.value.cultureKey.value,
      tile?.key ?? city.tileKey.value,
      city.player.value.religionKey.value,
    )
    this._objects.set(citizen)

    city.citizenKeys.value.push(citizen.key)

    return citizen
  }

  delete (citizen: Citizen) {
    citizen.city.value.citizenKeys.value = citizen.city.value.citizenKeys.value.filter(k => k !== citizen.key)
    if (citizen.work.value) citizen.work.value.citizenKeys.value = citizen.work.value.citizenKeys.value.filter(k => k !== citizen.key)
    this._objects.delete(citizen.key)
  }
}