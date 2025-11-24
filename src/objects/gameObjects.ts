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
} from '@/objects/gameMixins'
import { TypeObject } from '@/types/typeObjects'
import { Yield, Yields } from '@/objects/yield'
import { CatKey, ObjType } from '@/types/common'
import { ConstructionQueue, TrainingQueue } from '@/objects/queues'
import { TypeStorage } from '@/objects/storage'
import { Government, Research } from '@/objects/player'

const objStore = useObjectsStore()

export type GameClass =
  'agenda' |
  'citizen' |
  'city' |
  'culture' |
  'deal' |
  'player' |
  'religion' |
  'tile' |
  'tradeRoute' |
  'unit' |
  'unitDesign'

export type GameKey = `${GameClass}:${string}`

export const generateKey = (cls: GameClass) => getKey(cls, crypto.randomUUID())
export const getKey = (cls: GameClass, id: string): GameKey => `${cls}:${id}`

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

  types: TypeObject[]
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
    return new Yields(yields)
  })

  constructor (
    key: GameKey, type: TypeObject,
    cityKey: GameKey | null = null
  ) {
    super(key)
    this.cityKey.value = cityKey
    this.type = type
    this.name = type.name
    this.types = [type]
  }
}

export class Citizen extends HasCity(HasCulture(CanHaveReligion(HasPlayer(HasTile(GameObject))))) {
  policy = ref<TypeObject | null>(null)

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

  yields = computed(() => new Yields([
    ...this._tileYields.value.all(),
    ...(this._workYields.value?.all() ?? [])
  ]))
}

export class City extends HasCitizens(HasPlayer(HasTile(HasUnits(GameObject)))) {
  name = ref('')
  canAttack = ref(false)
  health = ref(100)
  isCapital = ref(false)

  constructionQueue = new ConstructionQueue()
  trainingQueue = new TrainingQueue()
  storage = new TypeStorage()

  holyCityForKeys = ref([] as GameKey[])
  holyCityFor = hasMany(this.holyCityForKeys, Religion)

  origPlayerKey: GameKey
  origPlayer = computed(() => objStore.get(this.origPlayerKey) as Player)

  private _tileYields = computed(() => this.tile.value.yields.value.only(
    this.concept.inheritYieldTypes!,
    [this.concept]
  ))

  private _citizenYields = computed((): Yields => {
    const inherit = this.concept.inheritYieldTypes!
    return new Yields(this.citizens.value.flatMap(
      c => c.yields.value.only(inherit).all()
    ))
  })

  yields = computed((): Yields => new Yields([
    ...this._tileYields.value.all(),
    ...this._citizenYields.value.all(),
  ]))

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

export type CultureStatus = 'notSettled' | 'canSettle' | 'mustSettle' | 'settled'

export class Culture extends HasCitizens(HasPlayer(GameObject)) {
  type: TypeObject
  status: CultureStatus = 'notSettled'

  heritages = ref([] as TypeObject[])
  heritageCategoryPoints = ref({} as Record<CatKey, number>)
  selectableHeritages = computed(() => [] as TypeObject[])

  traits = ref([] as TypeObject[])
  mustSelectTraits = ref({ positive: 0, negative: 0 })
  selectableTraits = computed(() => [] as TypeObject[])

  types = computed(() => [this.concept, ...this.heritages.value, ...this.traits.value])
  yields = computed(() => new Yields(this.types.value.flatMap(
    t => t.yields.all()
  )))

  constructor (key: GameKey, type: TypeObject, playerKey: GameKey) {
    super(key)
    this.type = type
    this.playerKey.value = playerKey
  }
}

export class Player extends HasCitizens(HasCulture(CanHaveReligion(HasUnits(GameObject)))) {
  name: string
  isCurrent = false
  knownTypes = computed(() => [] as TypeObject[])
  government: Government
  research: Research

  designKeys = ref([] as GameKey[])
  designs = hasMany(this.designKeys, UnitDesign)

  knownTileKeys = ref([] as GameKey[])
  knownTiles = hasMany(this.knownTileKeys, Tile)

  storage = new TypeStorage()
  yields = computed(() => new Yields())

  constructor (key: GameKey, name: string, isCurrent = false) {
    super(key)
    this.name = name
    this.isCurrent = isCurrent
    this.government = new Government(key)
    this.research = new Research(key)
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
  feature = ref<TypeObject | null>(null)
  resource = ref<TypeObject | null>(null)
  pollution = ref<TypeObject | null>(null)
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

  yields = computed(() => new Yields([
    ...this._staticYields.all(),
    ...this._dynamicTypes.flatMap(t => t.yields.all()),
  ]))

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
    return getKey('tile', `${x},${y}`)
  }
}

// mercenary: +10% strength, +50% upkeep, 1/city/t;
// regular: no effects
// levy: -20% strength, -1 happy if not at war, 1/city/t; can be demobilized -> becomes citizen
// reserve: -90% strength and upkeep, cannot move;        can be mobilized -> becomes mobilized and remove citizen
// mobilizing1: -60% strength, -1 happy if not at war;    can be demobilized -> becomes reserve and citizen
// mobilizing2: -30% strength, -1 happy if not at war;    can be demobilized -> becomes reserve and citizen
// mobilized: -10% strength, -1 happy if not at war;      can be demobilized -> becomes reserve and citizen
export type UnitStatus = 'mercenary' | 'regular' | 'levy' | 'reserve' | 'mobilizing1' | 'mobilizing2' | 'mobilized'

export class Unit extends HasPlayer(HasTile(GameObject)) {
  private _customName = ref('')
  name = computed(() => this._customName.value || this.design.value.name)

  canAttack = ref(false)
  moves = ref(0)
  health = ref(100)
  status = ref('regular' as UnitStatus)

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

  yields = computed(() => new Yields([
    ...this.design.value.yields.all(),
    ...this._playerYields.value.all(),
    ...this._tileYields.value.all(),
  ]))

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
  platform: TypeObject
  equipment: TypeObject
  name: string
  isElite: boolean
  productionCost: number
  types: TypeObject[]
  yields: Yields

  constructor (
    key: GameKey, platform: TypeObject, equipment: TypeObject, name: string,
    playerKey?: GameKey, isElite?: boolean
  ) {
    super(key)
    this.platform = platform
    this.equipment = equipment
    this.name = name
    this.isElite = !!isElite
    if (playerKey) this.playerKey.value = playerKey

    this.types = [this.platform, this.equipment]
    this.yields = new Yields(this.types.flatMap(t => t.yields.all()))
    this.productionCost = this.yields.applyMods().getLumpAmount('yieldType:productionCost')
  }
}
