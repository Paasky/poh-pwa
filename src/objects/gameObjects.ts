import { computed, Ref, ref, UnwrapRef } from 'vue'
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
import { CatKey, ObjType, roundToTenth, TypeKey } from '@/types/common'
import { ConstructionQueue, TrainingQueue } from '@/objects/queues'
import { TypeStorage } from '@/objects/storage'
import { Government, Research } from '@/objects/player'
import { EventManager } from '@/managers/eventManager'

const objStore = () => useObjectsStore()

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

export type GameObjAttr = {
  isTypeObj?: boolean
  isTypeObjArray?: boolean
  attrName: string
  isOptional?: boolean
  related?: {
    theirKeyAttr: string
    isOne?: boolean
  }
}

export const generateKey = (cls: GameClass) => getKey(cls, crypto.randomUUID())
export const getKey = (cls: GameClass, id: string): GameKey => `${cls}:${id}`

export class GameObject {
  // noinspection JSUnusedGlobalSymbols
  objType: ObjType = 'GameObject'
  key: GameKey
  class: GameClass
  concept: TypeObject
  id: string
  static attrsConf: GameObjAttr[] = []

  constructor (key: GameKey) {
    this.key = key
    const classAndId = key.split(':')
    this.class = classAndId[0] as GameClass
    this.concept = objStore().getTypeObject(`conceptType:${this.class}`)
    this.id = classAndId[1]
  }

  toJSON () {
    const out = {
      key: this.key,
    } as Record<string, any>

    for (const attr of (this.constructor as typeof GameObject).attrsConf) {
      const value = (this as any)[attr.attrName]

      // Empty data: only add if not optional
      if (value === undefined || value === null) {
        if (!attr.isOptional) {
          out[attr.attrName] = value
        }
        continue
      }

      // Special handling for TypeObjects
      if (attr.isTypeObj) {
        out[attr.attrName] = value.key
        continue
      }
      if (attr.isTypeObjArray) {
        out[attr.attrName] = value.map((v: TypeObject) => v.key)
        continue
      }

      // Normal attribute
      out[attr.attrName] = value
    }

    return out
  }
}

export class Agenda extends HasPlayer(GameObject) {
  static attrsConf: GameObjAttr[] = [
    { attrName: 'playerKey', related: { theirKeyAttr: 'agendaKeys' } },
  ]
}

export class Citizen extends HasCity(HasCulture(CanHaveReligion(HasPlayer(HasTile(GameObject))))) {
  static attrsConf: GameObjAttr[] = [
    { attrName: 'cityKey', related: { theirKeyAttr: 'citizenKeys' } },
    { attrName: 'cultureKey', related: { theirKeyAttr: 'citizenKeys' } },
    { attrName: 'religionKey', isOptional: true, related: { theirKeyAttr: 'citizenKeys' } },
    { attrName: 'tileKey', related: { theirKeyAttr: 'citizenKeys' } },
  ]
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

  constructor (key: GameKey, city: City, culture: Culture,
    religion: Religion | null = null, tile?: Tile
  ) {
    super(key)
    this.cityKey.value = city.key
    this.cultureKey.value = culture.key
    if (religion) this.religionKey.value = religion.key
    this.tileKey.value = tile?.key ?? city.tileKey.value

    if (tile?.constructionKey.value) {
      this.workKey.value = tile.constructionKey.value
      this.work.value!.citizenKeys.value.push(this.key)
    }
  }
}

export class City extends HasCitizens(HasPlayer(HasTile(HasUnits(GameObject)))) {
  static attrsConf: GameObjAttr[] = [
    { attrName: 'playerKey', related: { theirKeyAttr: 'cityKeys' } },
    { attrName: 'tileKey', related: { theirKeyAttr: 'cityKey', isOne: true } },
    { attrName: 'name' },
  ]

  name = ref('')
  canAttack = ref(false)
  health = ref(100)
  isCapital = ref(false)

  constructionQueue = new ConstructionQueue()
  trainingQueue = new TrainingQueue()
  storage = new TypeStorage()

  trainableDesigns = computed(() => this.player.value.designs.value)

  holyCityForKeys = ref([] as GameKey[])
  holyCityFor = hasMany(this.holyCityForKeys, Religion)

  origPlayerKey: GameKey
  origPlayer = computed(() => objStore().get(this.origPlayerKey) as Player)

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

export class Construction extends HasCitizens(CanHaveCity(HasPlayer(HasTile(GameObject)))) {
  static attrsConf: GameObjAttr[] = [
    { attrName: 'cityKey', isOptional: true, related: { theirKeyAttr: 'citizenKeys' } },
    { attrName: 'playerKey', related: { theirKeyAttr: 'cultureKey', isOne: true } },
    { attrName: 'tileKey', related: { theirKeyAttr: 'cityKey', isOne: true } },
    { attrName: 'type', isTypeObj: true },
  ]

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

export type CultureStatus = 'notSettled' | 'canSettle' | 'mustSettle' | 'settled'

export class Culture extends HasCitizens(HasPlayer(GameObject)) {
  static attrsConf: GameObjAttr[] = [
    { attrName: 'type', isTypeObj: true },
    { attrName: 'playerKey', related: { theirKeyAttr: 'cultureKey', isOne: true } },
  ]

  type: Ref<UnwrapRef<TypeObject>, UnwrapRef<TypeObject> | TypeObject>
  leader = computed(() => objStore().getTypeObject(
    this.type.value.allows.find(
      a => a.indexOf('LeaderType:') >= 0
    ) as TypeKey
  ))
  region = computed(() => objStore().getTypeObject(this.type.value.requires
    .filter(['regionType'])
    .allTypes[0] as TypeKey
  ))
  status = ref<CultureStatus>('notSettled')

  heritages = ref([] as TypeObject[])
  heritageCategoryPoints = ref({} as Record<CatKey, number>)

  selectableHeritages = computed((): TypeObject[] => {
    if (this.status.value === 'mustSettle') return []
    if (this.status.value === 'settled') return []

    const selectable: TypeObject[] = []
    for (const catData of objStore().getClassTypesPerCategory('heritageType')) {
      const catIsSelected = catData.types.some(
        h => this.heritages.value.includes(h)
      )

      for (const heritage of catData.types) {
        // Already selected
        if (this.heritages.value.includes(heritage)) continue

        // If it's stage II -> must have stage I heritage selected
        if (heritage.heritagePointCost! > 10 && !catIsSelected) continue

        // Not enough points
        if ((this.heritageCategoryPoints.value[heritage.category!] ?? 0) < heritage.heritagePointCost!) continue

        selectable.push(heritage)
      }
    }
    return selectable
  })

  traits = ref([] as TypeObject[])
  mustSelectTraits = ref({ positive: 0, negative: 0 })

  selectableTraits = computed((): TypeObject[] => {
    if (this.status.value !== 'settled') return []

    // Nothing to select?
    if (this.mustSelectTraits.value.positive + this.mustSelectTraits.value.negative <= 0) return []

    const selectable: TypeObject[] = []
    for (const catData of objStore().getClassTypesPerCategory('traitType')) {
      const catIsSelected = catData.types.some(
        t => this.traits.value.includes(t)
      )

      for (const trait of catData.types) {
        // Category already selected
        if (catIsSelected) continue

        // No more positive/negative slots left to select
        if (trait.isPositive! && this.mustSelectTraits.value.positive <= 0) continue
        if (!trait.isPositive! && this.mustSelectTraits.value.negative <= 0) continue

        selectable.push(trait)
      }
    }
    return selectable
  })

  evolve () {
    const nextTypeKey = this.type.value.upgradesTo[0]
    if (!nextTypeKey) throw new Error(`${this.key} cannot evolve further`)

    this.type.value = objStore().getTypeObject(nextTypeKey)

    // If all traits have not been selected yet (4 = two categories to select: one must be pos, one neg)
    if (this.selectableTraits.value.length >= 4) {
      this.mustSelectTraits.value.positive++
      this.mustSelectTraits.value.negative++
    }

    new EventManager().create(
      'cultureEvolved',
      `evolved to the ${this.type.value.name} culture`,
      this.player.value,
      this,
    )
  }

  selectHeritage (heritage: TypeObject) {
    if (this.heritages.value.includes(heritage)) return
    if (!this.selectableHeritages.value.includes(heritage)) throw new Error(`${this.key}: ${heritage.name} not selectable`)

    // Add the heritage
    this.heritages.value.push(heritage)

    // Check if culture status needs to change
    if (this.heritages.value.length === 2) {
      this.status.value = 'canSettle'
    }
    if (this.heritages.value.length > 2) {
      this.status.value = 'mustSettle'
    }

    // If gains a tech, complete it immediately
    for (const gainKey of heritage.gains) {
      if (gainKey.startsWith('technologyType:')) {
        this.player.value.research.complete(objStore().getTypeObject(gainKey))
      }
    }
  }

  selectTrait (trait: TypeObject) {
    if (this.traits.value.includes(trait)) return
    if (!this.selectableTraits.value.includes(trait)) throw new Error(`${this.key}: ${trait.name} not selectable`)

    this.traits.value.push(trait)
    if (trait.isPositive!) {
      this.mustSelectTraits.value.positive--
    } else {
      this.mustSelectTraits.value.negative--
    }
  }

  settle () {
    if (this.status.value === 'settled') return
    this.status.value = 'settled'
    this.mustSelectTraits.value = { positive: 2, negative: 2 }
    new EventManager().create(
      'settled',
      `settled down`,
      this.player.value,
      this,
    )
  }

  types = computed(() => [this.concept, ...this.heritages.value, ...this.traits.value])
  yields = computed(() => new Yields(this.types.value.flatMap(
    t => t.yields.all()
  )))

  constructor (key: GameKey, type: TypeObject, playerKey: GameKey) {
    super(key)
    this.type = ref(type)
    this.playerKey.value = playerKey
  }
}

export class Deal extends HasPlayer(GameObject) {
  static attrsConf: GameObjAttr[] = [
    { attrName: 'playerKey', related: { theirKeyAttr: 'dealKeys' } },
  ]

}

export class Player extends HasCitizens(HasCulture(CanHaveReligion(HasUnits(GameObject)))) {
  static attrsConf: GameObjAttr[] = [
    { attrName: 'name' },
    { attrName: 'isCurrent', isOptional: true },
    { attrName: 'religionKey', isOptional: true, related: { theirKeyAttr: 'playerKeys' } },
  ]

  name: string
  isCurrent = false
  knownTypes = computed(() => [] as TypeObject[])
  government: Government
  research: Research

  cityKeys = ref([] as GameKey[])
  cities = hasMany(this.cityKeys, City)

  designKeys = ref([] as GameKey[])
  designs = hasMany(this.designKeys, UnitDesign)

  activeDesigns = computed(() => this.designs.value.filter(d => d.isActive.value))

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
  static attrsConf: GameObjAttr[] = [
    { attrName: 'name' },
    { attrName: 'myths', isTypeObjArray: true },
    { attrName: 'gods', isTypeObjArray: true },
    { attrName: 'dogmas', isTypeObjArray: true },
    { attrName: 'cityKey', related: { theirKeyAttr: 'holyCityKeys' } },
  ]

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

export class Tile extends CanHaveCity(CanHavePlayer(HasUnits(GameObject))) {
  static attrsConf: GameObjAttr[] = [
    { attrName: 'x' },
    { attrName: 'y' },
    { attrName: 'domain', isTypeObj: true },
    { attrName: 'area', isTypeObj: true },
    { attrName: 'climate', isTypeObj: true },
    { attrName: 'terrain', isTypeObj: true },
    { attrName: 'elevation', isTypeObj: true },
    { attrName: 'feature', isTypeObj: true, isOptional: true },
    { attrName: 'resource', isTypeObj: true, isOptional: true },
    { attrName: 'naturalWonder', isTypeObj: true, isOptional: true },
    { attrName: 'pollution', isTypeObj: true, isOptional: true },
  ]

  x: number
  y: number
  domain: TypeObject
  area: TypeObject
  climate: TypeObject
  terrain: TypeObject
  elevation: TypeObject
  feature = ref<TypeObject | null>(null)
  resource = ref<TypeObject | null>(null)
  pollution = ref<TypeObject | null>(null)
  naturalWonder = null as TypeObject | null
  isFresh = false
  isSalt = false

  constructionKey = ref<GameKey | null>(null)
  construction = canHaveOne(this.constructionKey, Construction)

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
    x: number, y: number, domain: TypeObject, area: TypeObject, climate: TypeObject, terrain: TypeObject, elevation: TypeObject,
    feature?: TypeObject, resource?: TypeObject, naturalWonder?: TypeObject, pollution?: TypeObject
  ) {
    super(Tile.getKey(x, y))
    this.x = x
    this.y = y
    this.domain = domain
    this.area = area
    this.climate = climate
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
    return getKey('tile', `x${x},y${y}`)
  }
}

export class TradeRoute extends HasPlayer(GameObject) {
  static attrsConf: GameObjAttr[] = [
    { attrName: 'playerKey' },
  ]

}

// mercenary: +10% strength, +50% upkeep, 1/city/t;
// regular: no effects
// levy: -20% strength, -1 happy if not at war, 1/city/t; can be demobilized -> becomes citizen
// reserve: -90% strength and upkeep, cannot move;        can be mobilized -> becomes mobilized and remove citizen
// mobilizing1: -60% strength, -1 happy if not at war;    can be demobilized -> becomes reserve and citizen
// mobilizing2: -30% strength, -1 happy if not at war;    can be demobilized -> becomes reserve and citizen
// mobilized: -10% strength, -1 happy if not at war;      can be demobilized -> becomes reserve and citizen
export type UnitStatus = 'mercenary' | 'regular' | 'levy' | 'reserve' | 'mobilizing1' | 'mobilizing2' | 'mobilized'

export class Unit extends CanHaveCity(HasPlayer(HasTile(GameObject))) {
  static attrsConf: GameObjAttr[] = [
    { attrName: 'cityKey', related: { theirKeyAttr: 'unitKeys' } },
    { attrName: 'designKey', related: { theirKeyAttr: 'unitKeys' } },
    { attrName: 'playerKey', related: { theirKeyAttr: 'unitKeys' } },
    { attrName: 'tileKey', related: { theirKeyAttr: 'unitKeys' } },
    { attrName: 'name', isOptional: true },
    { attrName: 'action', isTypeObj: true, isOptional: true },
    { attrName: 'canAttack' },
    { attrName: 'health' },
    { attrName: 'moves' }
  ]

  private _customName = ref('')
  name = computed(() => this._customName.value || this.design.value.name)

  action = ref<TypeObject | null>(null)
  canAttack = ref(false)
  moves = ref(0)
  health = ref(100)
  status = ref('regular' as UnitStatus)

  designKey: GameKey
  design = computed(() => objStore().get(this.designKey) as UnitDesign)

  origPlayerKey: GameKey
  origPlayer = computed(() => objStore().get(this.origPlayerKey) as Player)

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

  delete () {
    this.design.value.unitKeys.value = this.design.value.unitKeys.value.filter(k => k !== this.key)
    this.player.value.unitKeys.value = this.player.value.unitKeys.value.filter(k => k !== this.key)
    this.tile.value.unitKeys.value = this.tile.value.unitKeys.value.filter(k => k !== this.key)
    if (this.city.value) this.city.value.unitKeys.value = this.city.value.unitKeys.value.filter(u => u !== this.key)
  }

  modifyHealth (amount: number) {
    this.health.value = Math.max(0, Math.min(100, roundToTenth(this.health.value + amount)))

    if (this.health.value <= 0) {
      new EventManager().create(
        'unitKilled',
        `${this.name.value} was killed`,
        this.player.value,
        this,
      )

      this.delete()
      return
    }

    if (this.health.value >= 100 && this.action.value?.key === 'actionType:heal') {
      new EventManager().create(
        'unitHealed',
        `${this.name.value} is fully healed`,
        this.player.value,
        this,
      )
      this.action.value = null
    }
  }

  constructor (
    key: GameKey, playerKey: GameKey, tileKey: GameKey, designKey: GameKey,
    name: string = ''
  ) {
    super(key)
    this.designKey = designKey
    this.playerKey.value = playerKey
    this.origPlayerKey = playerKey
    this.tileKey.value = tileKey
    this._customName.value = name
  }
}

export class UnitDesign extends CanHavePlayer(HasUnits(GameObject)) {
  static attrsConf: GameObjAttr[] = [
    { attrName: 'platform', isTypeObj: true },
    { attrName: 'equipment', isTypeObj: true },
    { attrName: 'name' },
    { attrName: 'playerKey', isOptional: true, related: { theirKeyAttr: 'designKeys' } },
    { attrName: 'isElite' },
    { attrName: 'isActive' }
  ]

  platform: TypeObject
  equipment: TypeObject
  name: string
  isActive = ref(true)
  isElite: boolean
  productionCost: number
  types: TypeObject[]
  yields: Yields

  constructor (
    key: GameKey, platform: TypeObject, equipment: TypeObject, name: string,
    playerKey?: GameKey, isElite?: boolean, isActive?: boolean
  ) {
    super(key)
    this.platform = platform
    this.equipment = equipment
    this.name = name
    this.isElite = !!isElite
    this.isActive.value = isActive ?? true
    if (playerKey) this.playerKey.value = playerKey

    this.types = [this.platform, this.equipment]
    this.yields = new Yields(this.types.flatMap(t => t.yields.all()))
    this.productionCost = this.yields.applyMods().getLumpAmount('yieldType:productionCost')
  }
}
