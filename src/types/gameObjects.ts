import { CatKey, GameKey, initPohObject, ObjKey, PohObject, TypeKey } from './common'
import { EventSetting, EventType } from '@/types/events'
import { TypeObject } from '@/types/typeObjects'
import { useObjectsStore } from '@/stores/objectStore'
import { CultureManager } from '@/managers/cultureManager'
import { Yield, Yields } from '@/objects/yield'
import { TypeStorage } from '@/objects/storage'

type GameClass =
  'agenda' |
  'building' |
  'citizen' |
  'city' |
  'culture' |
  'deal' |
  'improvement' |
  'nationalWonder' |
  'player' |
  'religion' |
  'tile' |
  'tradeRoute' |
  'unit' |
  'unitDesign' |
  'worldWonder'

type GameObject = PohObject & {
  objType: 'GameObject'
  class: GameClass
  key: GameKey
  type?: TypeObject
}
const _initGameObject = (rawData: any): GameObject => {
  const obj = initPohObject('GameObject', rawData) as GameObject

  // Load TypeObject if present and set the name from it
  if ('type' in rawData) {
    obj.type = useObjectsStore().getTypeObject(rawData.type)
    if (!obj.name) {
      obj.name = obj.type.name
    }
  }

  return obj
}

interface HasType {type: TypeObject}

const init = (rawData: any): GameObject => {
  const cls = rawData.class as GameClass

  if (cls === 'agenda') return initAgenda(rawData)
  if (cls === 'building') return initBuilding(rawData)
  if (cls === 'citizen') return initCitizen(rawData)
  if (cls === 'city') return initCity(rawData)
  if (cls === 'culture') return initCulture(rawData)
  if (cls === 'deal') return initDeal(rawData)
  if (cls === 'improvement') return initImprovement(rawData)
  if (cls === 'nationalWonder') return initNationalWonder(rawData)
  if (cls === 'player') return initPlayer(rawData)
  if (cls === 'religion') return initReligion(rawData)
  if (cls === 'tile') return initTile(rawData)
  if (cls === 'tradeRoute') return initTradeRoute(rawData)
  if (cls === 'unit') return initUnit(rawData)
  if (cls === 'unitDesign') return initUnitDesign(rawData)
  if (cls === 'worldWonder') return initWorldWonder(rawData)

  throw new Error('Unknown class: ' + cls)
}

/////////////////////////////
/////  Non-Tile Objects /////

type Agenda = GameObject & {
  name: string
  size: 'moderate' | 'ambitious'
  startTurn: number
  endTurn: number
  isComplete: boolean
  requirements: {
    key: ObjKey
    requiredAmount: number
    currentAmount: number
  }[]
}
const initAgenda = (rawData: any): Agenda => {
  const obj = _initGameObject(rawData) as Agenda

  obj.name = rawData.name
  obj.size = rawData.size
  obj.startTurn = rawData.startTurn
  obj.endTurn = rawData.endTurn
  obj.isComplete = rawData.isComplete
  obj.requirements = rawData.requirements

  return obj
}

type CultureStatus = 'notSettled' | 'canSettle' | 'mustSettle' | 'settled'
type Culture = GameObject & HasType & {
  player: GameKey,
  status: CultureStatus

  heritages: TypeObject[]
  heritageCategoryPoints: Record<CatKey, number>
  selectableHeritages: TypeObject[]

  traits: TypeObject[]
  selectableTraits: TypeObject[]
  mustSelectTraits: { positive: number, negative: number }

  yields: Yields
}
const initCulture = (rawData: any): Culture => {
  const obj = _initGameObject(rawData) as Culture

  obj.status = rawData.status
  obj.heritages = rawData.heritages.map((h: TypeKey) => useObjectsStore().getTypeObject(h))
  obj.heritageCategoryPoints = rawData.heritageCategoryPoints
  obj.selectableHeritages = []

  obj.traits = rawData.traits.map((t: TypeKey) => useObjectsStore().getTypeObject(t))
  obj.selectableTraits = []
  obj.mustSelectTraits = rawData.mustSelectTraits

  obj.yields = new Yields()

  const manager = new CultureManager()
  manager.calcSelectable(obj)
  manager.calcStatic(obj)

  return obj
}

type Deal = GameObject & {
  startTurn: number
  endTurn: number
  isComplete: boolean
  items: {
    to: GameKey
    from: GameKey
    type: TypeObject
    amount: number
    value: number
  }[]
}
const initDeal = (rawData: any): Deal => {
  const obj = _initGameObject(rawData) as Deal

  obj.startTurn = rawData.startTurn
  obj.endTurn = rawData.endTurn
  obj.isComplete = rawData.isComplete
  obj.items = rawData.items.map((it: any) => ({
    to: it.to,
    from: it.from,
    type: useObjectsStore().getTypeObject(it.type),
    amount: it.amount,
    value: it.value
  }))

  return obj
}

type Player = GameObject & {
  isCurrent: boolean
  leader: TypeObject

  knownTypes: TypeObject[]
  knownTiles: GameKey[]
  visibleTiles: GameKey[]
  ownedTiles: GameKey[]
  unitDesigns: GameKey[]
  units: GameKey[]
  cities: GameKey[]
  tradeRoutes: GameKey[]

  culture: GameKey
  religion?: GameKey

  diplomacy: Diplomacy
  government: Government
  research: Research
  unitDesigner: UnitDesigner
  yields: Yields

  resourceStorage: TypeStorage
  stockpileStorage: TypeStorage
  yieldStorage: TypeStorage

  eventSettings: Record<EventType, EventSetting>
}
const initPlayer = (rawData: any): Player => {
  const obj = _initGameObject(rawData) as Player

  obj.isCurrent = rawData.isCurrent
  obj.leader = useObjectsStore().getTypeObject(rawData.leader)

  obj.knownTypes = rawData.knownTypes ?? []
  obj.knownTiles = rawData.knownTiles ?? []
  obj.visibleTiles = rawData.visibleTiles ?? []
  obj.ownedTiles = rawData.ownedTiles ?? []
  obj.unitDesigns = rawData.unitDesigns ?? []
  obj.units = rawData.units ?? []
  obj.cities = rawData.cities ?? []
  obj.tradeRoutes = rawData.tradeRoutes ?? []

  obj.culture = rawData.culture
  if ('religion' in rawData) obj.religion = rawData.religion

  // Diplomacy
  obj.diplomacy = {
    deals: rawData.diplomacy?.deals ?? [],
    relations: rawData.diplomacy?.relations ?? {}
  }

  // Government
  obj.government = {
    turnsToElection: rawData.government.turnsToElection ?? 0,
    hasElections: rawData.government.hasElections ?? false,
    policyUnhappiness: rawData.government.policyUnhappiness ?? 0,
    corruptionDisorder: rawData.government.corruptionDisorder ?? 0,
    revolutionChance: rawData.government.revolutionChance ?? 0,
    inRevolution: rawData.government.inRevolution ?? false,

    policies: (rawData.government.policies ?? []).map((k: TypeKey) => useObjectsStore().getTypeObject(k)),
    selectablePolicies: [],
    agenda: rawData.government.agenda ?? [],

    specials: [],
    yields: new Yields(),
  }

  // Research
  const researched = (rawData.research.researched).map((k: TypeKey) => useObjectsStore().getTypeObject(k))
  const researchingRaw = rawData.research.researching
  const researching: Record<TypeKey, { type: TypeObject, progress: number }> = {}
  for (const [key, val] of Object.entries(researchingRaw)) {
    const v = val as any
    researching[key as TypeKey] = { type: useObjectsStore().getTypeObject(v.type), progress: v.progress }
  }
  obj.research = {
    era: null,
    researched,
    researching,
    current: rawData.research.current ? useObjectsStore().getTypeObject(rawData.research.current) : null,
    turnsLeft: 0,
    queue: rawData.research.queue.map((k: TypeKey) => useObjectsStore().getTypeObject(k)),
    yields: new Yields(),
  }

  // Storages
  obj.resourceStorage = new TypeStorage().load(rawData.resourceStorage)
  obj.stockpileStorage = new TypeStorage().load(rawData.stockpileStorage)
  obj.yieldStorage = new TypeStorage().load(rawData.yieldStorage)
  obj.yields = new Yields()

  // Preferences
  obj.eventSettings = rawData.eventSettings

  return obj
}

type Religion = GameObject & {
  status: 'myths' | 'gods' | 'dogmas'
  city: GameKey

  myths: TypeObject[]
  selectableMyths: TypeObject[]

  dogmas: TypeObject[]
  selectableDogmas: TypeObject[]

  gods: TypeObject[]
  selectableGods: TypeObject[]

  canEvolve: boolean
  yields: Yields
}
const initReligion = (rawData: any): Religion => {
  const obj = _initGameObject(rawData) as Religion

  obj.status = rawData.status
  obj.city = rawData.city

  obj.myths = rawData.myths.map((k: TypeKey) => useObjectsStore().getTypeObject(k))
  obj.selectableMyths = []
  obj.dogmas = rawData.dogmas.map((k: TypeKey) => useObjectsStore().getTypeObject(k))
  obj.selectableDogmas = []
  obj.gods = rawData.gods.map((k: TypeKey) => useObjectsStore().getTypeObject(k))
  obj.selectableGods = []

  obj.canEvolve = rawData.canEvolve
  obj.yields = new Yields()

  return obj
}

type TradeRoute = GameObject & {
  from: GameKey
  to: GameKey
  tiles: GameKey[]
  distance: number
  resources: TypeKey[]
}
const initTradeRoute = (rawData: any): TradeRoute => {
  const obj = _initGameObject(rawData) as TradeRoute

  obj.from = rawData.from
  obj.to = rawData.to
  obj.tiles = rawData.tiles
  obj.distance = rawData.distance
  obj.resources = rawData.resources

  return obj
}

/////////////////////////
/////  Tile Objects /////

type Tile = GameObject & {
  x: number
  y: number
  domain: TypeObject
  area: TypeObject
  terrain: TypeObject
  elevation: TypeObject
  feature?: TypeObject
  river?: GameKey
  resource?: TypeObject
  route?: GameKey
  player?: GameKey
  construction?: GameKey
  pollution?: TypeObject
  citizens: GameKey[]
  tradeRoutes: GameKey[]
  units: GameKey[]

  yields: Yields
}
const initTile = (rawData: any): Tile => {
  const obj = _initGameObject(rawData) as Tile

  obj.x = rawData.x
  obj.y = rawData.y
  obj.domain = useObjectsStore().getTypeObject(rawData.domain)
  obj.area = useObjectsStore().getTypeObject(rawData.area)
  obj.terrain = useObjectsStore().getTypeObject(rawData.terrain)
  obj.elevation = useObjectsStore().getTypeObject(rawData.elevation)
  if ('feature' in rawData) obj.feature = useObjectsStore().getTypeObject(rawData.feature)
  if ('river' in rawData) obj.river = rawData.river
  if ('resource' in rawData) obj.resource = useObjectsStore().getTypeObject(rawData.resource)
  if ('route' in rawData) obj.route = rawData.route
  if ('player' in rawData) obj.player = rawData.player
  if ('construction' in rawData) obj.construction = rawData.construction
  if ('pollution' in rawData) obj.pollution = useObjectsStore().getTypeObject(rawData.pollution)
  obj.citizens = rawData.citizens
  obj.tradeRoutes = rawData.tradeRoutes
  obj.units = rawData.units

  obj.yields = new Yields()

  return obj
}

type TileObject = GameObject & {
  tile: GameKey
}
const initTileObject = (rawData: any): TileObject => {
  const obj = _initGameObject(rawData) as TileObject

  obj.tile = rawData.tile

  return obj
}

type City = TileObject & {
  canProduce: TypeObject[]
  player: GameKey
  health: number
  citizens: GameKey[]
  units: GameKey[]

  yields: Yield[]
}
const initCity = (rawData: any): City => {
  const obj = initTileObject(rawData) as City

  obj.canProduce = rawData.canProduce
  obj.player = rawData.player
  obj.health = rawData.health
  obj.citizens = rawData.citizens
  obj.units = rawData.units

  obj.yields = []

  return obj
}

type Building = TileObject & HasType & {
  health: number
  citizens: GameKey[]
}
const initBuilding = (rawData: any): Building => {
  const obj = initTileObject(rawData) as Building

  obj.type = useObjectsStore().getTypeObject(rawData.type)
  obj.health = rawData.health
  obj.citizens = rawData.citizens

  return obj
}

type NationalWonder = TileObject & HasType & {
  health: number
  citizen?: GameKey
}
const initNationalWonder = (rawData: any): NationalWonder => {
  const obj = initTileObject(rawData) as NationalWonder

  obj.type = useObjectsStore().getTypeObject(rawData.type)
  obj.health = rawData.health
  if ('citizen' in rawData) obj.citizen = rawData.citizen

  return obj
}

type WorldWonder = TileObject & HasType & {
  health: number
  citizen?: GameKey
}
const initWorldWonder = (rawData: any): WorldWonder => {
  const obj = initTileObject(rawData) as WorldWonder

  obj.type = useObjectsStore().getTypeObject(rawData.type)
  obj.health = rawData.health
  if ('citizen' in rawData) obj.citizen = rawData.citizen

  return obj
}

type Improvement = TileObject & HasType & {
  health: number
  citizens: GameKey[]
}
const initImprovement = (rawData: any): Improvement => {
  const obj = initTileObject(rawData) as Improvement

  obj.type = useObjectsStore().getTypeObject(rawData.type)
  obj.health = rawData.health
  obj.citizens = rawData.citizens

  return obj
}

type Citizen = TileObject & {
  city: GameKey
  culture: GameKey
  religion?: GameKey
  policy?: TypeObject
  workplace?: GameKey

  yields: Yield[]
}
const initCitizen = (rawData: any): Citizen => {
  const obj = initTileObject(rawData) as Citizen

  obj.city = rawData.city
  obj.culture = rawData.culture
  if ('religion' in rawData) obj.religion = rawData.religion
  if ('policy' in rawData) obj.policy = useObjectsStore().getTypeObject(rawData.policy)
  if ('workplace' in rawData) obj.workplace = rawData.workplace

  obj.yields = []

  return obj
}

type Unit = TileObject & {
  design: GameKey
  player: GameKey
  originalPlayer?: GameKey
  health: number
  moves: number
  city?: GameKey
  tradeRoute?: GameKey
  isLevy: boolean
  isMercenary: boolean
  isMobilized: boolean
}
const initUnit = (rawData: any): Unit => {
  const obj = initTileObject(rawData) as Unit

  obj.design = rawData.design
  obj.player = rawData.player
  if ('originalPlayer' in rawData) obj.originalPlayer = rawData.originalPlayer
  obj.health = rawData.health
  obj.moves = rawData.moves
  if ('city' in rawData) obj.city = rawData.city
  if ('tradeRoute' in rawData) obj.tradeRoute = rawData.tradeRoute
  obj.isLevy = rawData.isLevy
  obj.isMercenary = rawData.isMercenary
  obj.isMobilized = rawData.isMobilized

  return obj
}

type UnitDesign = GameObject & {
  player: GameKey
  equipment: TypeObject
  platform: TypeObject
  isElite: boolean
  isActive: boolean

  actions: TypeObject[]
  requires: TypeObject[] | TypeObject[][]
  specials: TypeObject[]
  yields: Yield[]
}
const initUnitDesign = (rawData: any): UnitDesign => {
  const obj = _initGameObject(rawData) as UnitDesign

  obj.player = rawData.player
  obj.equipment = useObjectsStore().getTypeObject(rawData.equipment)
  obj.platform = useObjectsStore().getTypeObject(rawData.platform)
  obj.isElite = rawData.isElite
  obj.isActive = rawData.isActive

  obj.actions = []
  obj.requires = []
  obj.specials = []
  obj.yields = []

  return obj
}

////////////////////
/////  Helpers /////

type Relation = {
  trust: { amount: number, from: GameKey }[]
  friendship: { amount: number, from: GameKey }[]
  strength: number
  distance: number
}
type Diplomacy = {
  deals: GameKey[]
  relations: Record<GameKey, Relation>
}
type Government = {
  turnsToElection: number
  hasElections: boolean
  policyUnhappiness: number
  corruptionDisorder: number
  revolutionChance: number
  inRevolution: boolean

  policies: TypeObject[]
  selectablePolicies: TypeObject[]
  agenda: GameKey[]

  specials: TypeObject[]
  yields: Yields
}
type Research = {
  current: TypeObject | null
  era: TypeObject | null
  queue: TypeObject[]
  researched: TypeObject[]
  researching: Record<TypeKey, { type: TypeObject, progress: number }>
  turnsLeft: number
  yields: Yields
}
type UnitDesigner = {
  levyDesign: GameKey
  upgradePaths: Record<GameKey, GameKey[]>
}