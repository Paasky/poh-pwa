import { computed, Ref, ref } from 'vue'
import { useObjectsStore } from '@/stores/objectStore'
import { Citizen, City, Culture, GameKey, Player, Religion, Tile, Unit } from '@/objects/game/gameObjects'

const objStore = () => useObjectsStore()

export function hasMany<T> (
  keysRef: Ref<GameKey[]>,
  ctor: new (...args: any[]) => T
) {
  const out: T[] = []

  return computed<T[]>(() => {
    const keys = keysRef.value

    // Resize output to match
    if (out.length !== keys.length) out.length = keys.length

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      // Always read – creates a dependency on the store entry for this key
      try {
        const obj = objStore().get(key) as T
        if (out[i] !== obj) out[i] = obj
      } catch (e) {
        throw new Error(`${ctor.name} HasMany: ${e}`)
      }
    }

    return out
  })
}

export function hasOne<T> (
  keyRef: Ref<GameKey | null>,
  ctor: new (...args: any[]) => T
) {
  return computed<T>(() => {
    const key = keyRef.value
    if (!key) {
      throw new Error(`${ctor.name} HasOne: Empty relation value for ${ctor.name}`)
    }

    return objStore().get(key) as T
  })
}

export function canHaveOne<T> (
  keyRef: Ref<GameKey | null>,
  ctor: new (...args: any[]) => T
) {
  return computed<T | null>(() => {
    const key = keyRef.value
    if (!key) {
      return null
    }

    return objStore().get(key) as T
  })
}

export function HasCitizens<TBase extends new (...args: any[]) => {}> (Base: TBase) {
  return class extends Base {
    citizenKeys = ref([] as GameKey[])
    citizens = hasMany(this.citizenKeys, Citizen)
  }
}

export function HasCity<T extends new (...args: any[]) => {}> (Base: T) {
  return class extends Base {
    cityKey = ref('' as GameKey)
    city = hasOne(this.cityKey, City)
  }
}

export function CanHaveCity<T extends new (...args: any[]) => {}> (Base: T) {
  return class extends Base {
    cityKey = ref(null as GameKey | null)
    city = canHaveOne(this.cityKey, City)
  }
}

export function HasCulture<T extends new (...args: any[]) => {}> (Base: T) {
  return class extends Base {
    cultureKey = ref('' as GameKey)
    culture = hasOne(this.cultureKey, Culture)
  }
}

export function CanHavePlayer<T extends new (...args: any[]) => {}> (Base: T) {
  return class extends Base {
    playerKey = ref(null as GameKey | null)
    player = canHaveOne(this.playerKey, Player)
  }
}

export function HasPlayer<T extends new (...args: any[]) => {}> (Base: T) {
  return class extends Base {
    playerKey = ref<GameKey>('' as GameKey)
    player = hasOne(this.playerKey, Player)
  }
}

export function HasPlayers<TBase extends new (...args: any[]) => {}> (Base: TBase) {
  return class extends Base {
    playerKeys = ref([] as GameKey[])
    players = hasMany(this.playerKeys, Player)
  }
}

export function CanHaveReligion<T extends new (...args: any[]) => {}> (Base: T) {
  return class extends Base {
    religionKey = ref(null as GameKey | null)
    religion = canHaveOne(this.religionKey, Religion)
  }
}

export function HasTile<T extends new (...args: any[]) => {}> (Base: T) {
  return class extends Base {
    tileKey = ref('' as GameKey)
    tile = hasOne(this.tileKey, Tile)
  }
}

export function HasTiles<TBase extends new (...args: any[]) => {}> (Base: TBase) {
  return class extends Base {
    tileKeys = ref([] as GameKey[])
    tiles = hasMany(this.tileKeys, Tile)
  }
}

export function HasUnits<TBase extends new (...args: any[]) => {}> (Base: TBase) {
  return class extends Base {
    unitKeys = ref([] as GameKey[])
    units = hasMany(this.unitKeys, Unit)
  }
}
