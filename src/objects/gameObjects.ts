import { computed, ref } from 'vue'
import { useObjectsStore } from '@/stores/objectStore'
import {
  CanHaveCity,
  canHaveOne,
  CanHavePlayer,
  CanHaveReligion,
  HasCitizens,
  HasCity,
  HasCulture,
  hasMany,
  HasPlayer,
  HasPlayers,
  HasTile,
  HasUnits
} from './gameMixins'
import { TypeObject } from '@/types/typeObjects'
import { Yield, Yields } from '@/types/yield'
import { CatKey, ObjType, TypeStorage } from '@/types/common'

const objStore = useObjectsStore()

type GameClass = 'tile' | 'player' | 'unit'
type GameKey = `${GameClass}:${string}`

const generateKey = (cls: GameClass, id: string): GameKey => `${cls}:${id}`

export class GameObject {
  objType: ObjType = 'GameObject'
  key: GameKey
  class: GameClass
  concept: TypeObject
  id: string

  constructor (key: GameKey) {
    this.key = key
    const classAndId = key.split(':')
    this.class = classAndId[0] as GameClass
    this.concept = objStore.getTypeObject(`conceptType:${this.class}`)
    this.id = classAndId[1]
  }
}

export class Construction extends HasCitizens(CanHaveCity(HasPlayer(HasTile(GameObject)))) {
  type: TypeObject // buildingType/improvementType/nationalWonderType/worldWonderType
  name: string

  health = ref(100)
  progress = ref(0)
  completedAtTurn = ref(null as number | null)

  yields = computed(() => {
    // Is a Wonder or full health -> no yield changes
    if (this.type.class === 'nationalWonderType'
      || this.type.class === 'worldWonderType'
      || this.health.value >= 100
    ) {
      return this.type.yields
    }

    const yields = [] as Yield[]
    for (const y of this.type.yields.all()) {

      // Include the original yield
      yields.push(y)

      // If it's a lump yield, add a -health% modifier
      if (y.method === 'lump') {
        yields.push({
          ...y,
          method: 'percent',
          amount: this.health.value - 100
        })
      }
    }
  })

  constructor (
    key: GameKey, type: TypeObject,
    cityKey: GameKey | null = null
  ) {
    super(key)
    this.cityKey.value = cityKey
    this.type = type
    this.name = type.name
  }
}

export class Citizen extends HasCity(HasCulture(CanHaveReligion(HasPlayer(HasTile(GameObject))))) {
  policy = ref(null as TypeObject | null)

  workKey = ref(null as GameKey | null)
  work = canHaveOne(this.workKey, Construction)

  private _tileYields = computed(() => this.tile.value.yields.value.only(
    this.concept.inheritYieldTypes!,
    [this.concept]
  ))
  private _workYields = computed((): Yields | null => this.work.value?.yields.value.only(
    this.concept.inheritYieldTypes!,
    [this.concept]
  ) ?? null)
  yields = computed(() => {
    const yields = [] as Yield[]
    yields.push(...this._tileYields.value.all())
    if (this._workYields.value) yields.push(...this._workYields.value.all())
    return new Yields(yields)
  })
}

export class City extends HasCitizens(HasPlayer(HasTile(HasUnits(GameObject)))) {
  name = ref('')
  canAttack = ref(false)
  health = ref(100)

  holyCityForKeys = ref([] as GameKey[])
  holyCityFor = hasMany(this.holyCityForKeys, Religion)

  origPlayerKey: GameKey
  origPlayer = computed(() => objStore.get(this.origPlayerKey) as Player)

  private _tileYields = computed(() => this.tile.value.yields.value.only(
    this.concept.inheritYieldTypes!,
    [this.concept]
  ))

  private _citizenYields = computed((): Yields => {
    const yields: Yield[] = []
    const inherit = this.concept.inheritYieldTypes!

    for (const c of this.citizens.value) {
      yields.push(...c.yields.value.only(inherit).all())
    }

    return new Yields(yields)
  })

  yields = computed((): Yields => {
    const yields: Yield[] = []
    yields.push(...this._tileYields.value.all())
    yields.push(...this._citizenYields.value.all())
    return new Yields(yields)
  })

  constructor (
    key: GameKey, playerKey: GameKey, tileKey: GameKey, name: string
  ) {
    super(key)
    this.origPlayerKey = playerKey
    this.playerKey.value = playerKey
    this.tileKey.value = tileKey
    this.name.value = name
  }
}

export class Culture extends HasCitizens(HasPlayer(GameObject)) {
  heritages = ref([] as TypeObject[])
  heritageCategoryPoints = ref({} as Record<CatKey, number>)
  traits = ref([] as TypeObject[])

  types = computed(() => [this.concept, ...this.heritages.value, ...this.traits.value])
}

export class Government extends HasPlayer(GameObject) {
  policies = ref([] as TypeObject[])

  hasElections = computed(() => !!this.policies.value.find(
    (p) => p.specials.includes('specialType:elections'))
  )
}

export class Player extends HasCulture(CanHaveReligion(HasUnits(GameObject))) {
  name: string
  knownTileKeys = ref([] as GameKey[])
  knownTiles = hasMany(this.knownTileKeys, Tile)

  storage = new TypeStorage()
  yields = computed(() => new Yields())

  constructor (key: GameKey, name: string) {
    super(key)
    this.name = name
  }
}

export class Religion extends HasCitizens(HasCity(HasPlayers(GameObject))) {
  name: string
  myths: TypeObject[] = []
  gods: TypeObject[] = []
  dogmas: TypeObject[] = []

  types = computed(() => [this.concept, ...this.myths, ...this.gods, ...this.dogmas])

  constructor (key: GameKey, name: string) {
    super(key)
    this.name = name
  }
}

export class Tile extends CanHavePlayer(HasUnits(GameObject)) {
  x: number
  y: number
  domain: TypeObject
  area: TypeObject
  terrain: TypeObject
  elevation: TypeObject
  feature = ref(null as TypeObject | null)
  resource = ref(null as TypeObject | null)
  pollution = ref(null as TypeObject | null)
  naturalWonder = null as TypeObject | null

  private _staticTypes: TypeObject[]
  private _dynamicTypes: TypeObject[] = []
  private _staticYields: Yields

  types = computed(() => {
    this._dynamicTypes.length = 0

    if (this.feature.value) this._dynamicTypes.push(this.feature.value as TypeObject)
    if (this.resource.value) this._dynamicTypes.push(this.resource.value as TypeObject)
    if (this.pollution.value) this._dynamicTypes.push(this.pollution.value as TypeObject)

    return this._staticTypes.concat(this._dynamicTypes)
  })

  yields = computed(() => {
    const yields = this._staticYields.all()
    for (const t of this._dynamicTypes) yields.push(...t.yields.all())
    return new Yields(yields)
  })

  constructor (
    x: number, y: number, domain: TypeObject, area: TypeObject, terrain: TypeObject, elevation: TypeObject,
    feature?: TypeObject, resource?: TypeObject, naturalWonder?: TypeObject, pollution?: TypeObject
  ) {
    super(Tile.getKey(x, y))
    this.x = x
    this.y = y
    this.domain = domain
    this.area = area
    this.terrain = terrain
    this.elevation = elevation
    if (feature) this.feature.value = feature
    if (resource) this.resource.value = resource
    if (naturalWonder) this.naturalWonder = naturalWonder
    if (pollution) this.pollution.value = pollution

    this._staticTypes = [domain, area, terrain, elevation]
    if (this.naturalWonder) this._staticTypes.push(this.naturalWonder)

    this._staticYields = new Yields(this._staticTypes.flatMap(t => t.yields.all()))

  }

  static getKey (x: number, y: number): GameKey {
    return generateKey('tile', `${x},${y}`)
  }
}

export class Unit extends HasPlayer(HasTile(GameObject)) {
  private _customName = ref('')
  name = computed(() => this._customName.value || this.design.value.name)

  canAttack = ref(false)
  moves = ref(0)
  health = ref(100)

  designKey: GameKey
  design = computed(() => objStore.get(this.designKey) as UnitDesign)

  myTypes = computed((): TypeObject[] => [this.concept, this.design.value.platform, this.design.value.equipment])
  types = computed((): TypeObject[] => {
    return this.myTypes.value.concat(this.tile.value.types.value)
  })

  // yields.only runs a filter, so reduce compute-ref-chaining by storing the result here
  private _playerYields = computed(() =>
    this.player.value.yields.value.only(this.concept.inheritYieldTypes!, this.types.value)
  )

  // yields.only runs a filter, so reduce compute-ref-chaining by storing the result here
  private _tileYields = computed(() =>
    this.tile.value.yields.value.only(this.concept.inheritYieldTypes!, this.types.value)
  )

  yields = computed(() => {
    const yields: Yield[] = []
    yields.push(...this.design.value.yields.all())
    yields.push(...this._playerYields.value.all())
    yields.push(...this._tileYields.value.all())
    return new Yields(yields)
  })

  constructor (
    key: GameKey, playerKey: GameKey, tileKey: GameKey, designKey: GameKey,
    name: string = ''
  ) {
    super(key)
    this.designKey = designKey
    this.playerKey.value = playerKey
    this.tileKey.value = tileKey
    this._customName.value = name
  }
}

export class UnitDesign extends CanHavePlayer(HasUnits(GameObject)) {
  name: string
  platform: TypeObject
  equipment: TypeObject
  yields: Yields

  constructor (
    key: GameKey, platform: TypeObject, equipment: TypeObject, name: string,
    playerKey?: GameKey
  ) {
    super(key)
    this.platform = platform
    this.equipment = equipment
    this.name = name
    if (playerKey) this.playerKey.value = playerKey

    this.yields = new Yields([...platform.yields.all(), ...equipment.yields.all()])
  }
}

