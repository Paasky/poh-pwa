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
  HasTiles,
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
  'river' |
  'player' |
  'religion' |
  'tile' |
  'tradeRoute' |
  'unit' |
  'unitDesign'

export type GameKey = `${GameClass}:${string}`

export const generateKey = (cls: GameClass) => getKey(cls, crypto.randomUUID())
export const getKey = (cls: GameClass, id: string): GameKey => `${cls}:${id}`

export type GameObjAttr = {
  isTypeObj?: boolean
  isTypeObjArray?: boolean
  attrName: string
  attrNotRef?: boolean
  isOptional?: boolean
  related?: {
    theirKeyAttr: string
    isOne?: boolean
  }
}

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

      // Most data is actually a ref(data) so extract the .value
      const directValue = (this as any)[attr.attrName]
      const value = attr.attrNotRef
        ? directValue
        : directValue.value

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
  constructor (key: GameKey, playerKey: GameKey) {
    super(key)
    this.playerKey.value = playerKey
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: 'playerKey', related: { theirKeyAttr: 'agendaKeys' } },
  ]
}

export class Citizen extends HasCity(HasCulture(CanHaveReligion(HasPlayer(HasTile(GameObject))))) {
  constructor (
    key: GameKey,
    cityKey: GameKey,
    cultureKey: GameKey,
    tileKey: GameKey,
    religionKey: GameKey | null = null,
  ) {
    super(key)
    this.cityKey.value = cityKey
    this.cultureKey.value = cultureKey
    this.tileKey.value = tileKey
    if (religionKey) this.religionKey.value = religionKey
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: 'cityKey', related: { theirKeyAttr: 'citizenKeys' } },
    { attrName: 'cultureKey', related: { theirKeyAttr: 'citizenKeys' } },
    { attrName: 'tileKey', related: { theirKeyAttr: 'citizenKeys' } },
    { attrName: 'religionKey', isOptional: true, related: { theirKeyAttr: 'citizenKeys' } },
    { attrName: 'workKey', isOptional: true, related: { theirKeyAttr: 'citizenKeys' } },
    { attrName: 'policy', isOptional: true, isTypeObj: true },
  ]

  policy = ref<TypeObject | null>(null)

  work = computed(() => this.tile.value.construction.value)

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
  constructor (
    key: GameKey,
    playerKey: GameKey,
    tileKey: GameKey,
    name: string
  ) {
    super(key)
    this.origPlayerKey = playerKey
    this.playerKey.value = playerKey
    this.tileKey.value = tileKey
    this.name.value = name
  }

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
}

export class Construction extends HasCitizens(CanHaveCity(HasTile(GameObject))) {
  constructor (
    key: GameKey,
    type: TypeObject,
    tileKey: GameKey,
    cityKey: GameKey | null = null,
    health = 100,
    progress = 0,
  ) {
    super(key)
    this.type = type
    this.tileKey.value = tileKey
    if (cityKey) this.cityKey.value = cityKey
    this.name = type.name
    this.types = [type]
    this.health.value = health
    this.progress.value = progress
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: 'type', isTypeObj: true },
    { attrName: 'tileKey', related: { theirKeyAttr: 'cityKey', isOne: true } },
    { attrName: 'cityKey', isOptional: true, related: { theirKeyAttr: 'citizenKeys' } },
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
}

export type CultureStatus = 'notSettled' | 'canSettle' | 'mustSettle' | 'settled'

export class Culture extends HasCitizens(HasPlayer(GameObject)) {
  constructor (
    key: GameKey,
    type: TypeObject,
    playerKey: GameKey
  ) {
    super(key)
    this.type = ref(type)
    this.playerKey.value = playerKey
  }

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
}

export class Deal extends HasPlayer(GameObject) {
  constructor (
    key: GameKey,
    playerKey: GameKey
  ) {
    super(key)
    this.playerKey.value = playerKey
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: 'playerKey', related: { theirKeyAttr: 'dealKeys' } },
  ]
}

export class Player extends HasCitizens(HasCulture(CanHaveReligion(HasUnits(GameObject)))) {
  constructor (
    key: GameKey,
    name: string,
    isCurrent = false,
    religionKey?: GameKey,
  ) {
    super(key)
    this.name = name
    this.isCurrent = isCurrent
    if (religionKey) this.religionKey.value = religionKey

    this.government = new Government(key)
    this.research = new Research(key)
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: 'name', attrNotRef: true },
    { attrName: 'isCurrent', attrNotRef: true, isOptional: true },
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
}

export class Religion extends HasCitizens(HasCity(HasPlayers(GameObject))) {
  constructor (
    key: GameKey,
    name: string,
    cityKey: GameKey,
    myths: TypeObject[] = [],
    gods: TypeObject[] = [],
    dogmas: TypeObject[] = [],
  ) {
    super(key)
    this.name = name
    this.cityKey.value = cityKey
    this.myths.value = myths
    this.gods.value = gods
    this.dogmas.value = dogmas
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: 'name' },
    { attrName: 'cityKey', related: { theirKeyAttr: 'holyCityKeys' } },
    { attrName: 'myths', isOptional: true, isTypeObjArray: true },
    { attrName: 'gods', isOptional: true, isTypeObjArray: true },
    { attrName: 'dogmas', isOptional: true, isTypeObjArray: true },
  ]

  name: string
  myths = ref<TypeObject[]>([])
  gods = ref<TypeObject[]>([])
  dogmas = ref<TypeObject[]>([])

  types = computed(() => [this.concept, ...this.myths.value, ...this.gods.value, ...this.dogmas.value])
}

export class Tile extends CanHaveCity(CanHavePlayer(HasUnits(GameObject))) {
  constructor (
    key: GameKey,
    x: number,
    y: number,
    domain: TypeObject,
    area: TypeObject,
    climate: TypeObject,
    terrain: TypeObject,
    elevation: TypeObject,
    feature?: TypeObject,
    resource?: TypeObject,
    naturalWonder?: TypeObject,
    pollution?: TypeObject
  ) {
    super(key)
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

  static attrsConf: GameObjAttr[] = [
    { attrName: 'x' },
    { attrName: 'y' },
    { attrName: 'domain', isTypeObj: true },
    { attrName: 'area', isTypeObj: true },
    { attrName: 'climate', isTypeObj: true },
    { attrName: 'terrain', isTypeObj: true },
    { attrName: 'elevation', isTypeObj: true },
    { attrName: 'feature', isOptional: true, isTypeObj: true },
    { attrName: 'resource', isOptional: true, isTypeObj: true },
    { attrName: 'naturalWonder', isOptional: true, isTypeObj: true },
    { attrName: 'pollution', isOptional: true, isTypeObj: true },
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
  isMajorRiver = false
  isSalt = false

  constructionKey = ref<GameKey | null>(null)
  construction = canHaveOne(this.constructionKey, Construction)

  riverKey: GameKey | null = null
  river = computed(() => this.riverKey ? objStore().get(this.riverKey) as River : null)

  private _staticTypes: TypeObject[]
  private _dynamicTypes: TypeObject[] = []
  private _staticYields: Yields

  types = computed(() => {
    this._dynamicTypes.length = 0

    if (this.feature.value) this._dynamicTypes.push(this.feature.value)
    if (this.resource.value) this._dynamicTypes.push(this.resource.value)
    if (this.pollution.value) this._dynamicTypes.push(this.pollution.value)

    return this._staticTypes.concat(this._dynamicTypes)
  })

  yields = computed(() => new Yields([
    ...this._staticYields.all(),
    ...this._dynamicTypes.flatMap(t => t.yields.all()),
  ]))

  static getKey (x: number, y: number): GameKey {
    return getKey('tile', `x${x},y${y}`)
  }
}

export class River extends HasTiles(GameObject) {
  constructor (key: GameKey) {
    super(key)
  }
}

export class TradeRoute extends HasPlayer(GameObject) {
  constructor (
    key: GameKey,
    playerKey: GameKey,
  ) {
    super(key)
    this.playerKey.value = playerKey
  }

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
  constructor (
    key: GameKey,
    designKey: GameKey,
    playerKey: GameKey,
    tileKey: GameKey,
    cityKey?: GameKey,
    name?: string,
    action?: TypeObject,
    canAttack = false,
    health = 100,
    moves = 0,
    status: UnitStatus = 'regular'
  ) {
    super(key)
    this.designKey = designKey
    this.playerKey.value = playerKey
    this.origPlayerKey = playerKey
    this.tileKey.value = tileKey
    if (cityKey) this.cityKey.value = cityKey
    if (name) this.name.value = name
    if (action) this.action.value = action
    this.canAttack.value = canAttack
    this.health.value = health
    this.moves.value = moves
    this.status.value = status
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: 'designKey', related: { theirKeyAttr: 'unitKeys' } },
    { attrName: 'playerKey', related: { theirKeyAttr: 'unitKeys' } },
    { attrName: 'tileKey', related: { theirKeyAttr: 'unitKeys' } },
    { attrName: 'cityKey', isOptional: true, related: { theirKeyAttr: 'unitKeys' } },
    { attrName: 'name', isOptional: true },
    { attrName: 'action', isOptional: true, isTypeObj: true },
    { attrName: 'canAttack', isOptional: true },
    { attrName: 'health', isOptional: true },
    { attrName: 'moves', isOptional: true }
  ]

  name = ref('')
  action = ref<TypeObject | null>(null)
  canAttack = ref(false)
  health = ref(100)
  moves = ref(0)
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
}

export class UnitDesign extends CanHavePlayer(HasUnits(GameObject)) {
  constructor (
    key: GameKey,
    platform: TypeObject,
    equipment: TypeObject,
    name: string,
    playerKey?: GameKey,
    isElite?: boolean,
    isActive?: boolean
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

  static attrsConf: GameObjAttr[] = [
    { attrName: 'platform', isTypeObj: true },
    { attrName: 'equipment', isTypeObj: true },
    { attrName: 'name' },
    { attrName: 'playerKey', isOptional: true, related: { theirKeyAttr: 'designKeys' } },
    { attrName: 'isElite', isOptional: true },
    { attrName: 'isActive', isOptional: true }
  ]

  platform: TypeObject
  equipment: TypeObject
  name: string
  isActive = ref(true)
  isElite: boolean
  productionCost: number
  types: TypeObject[]
  yields: Yields
}
