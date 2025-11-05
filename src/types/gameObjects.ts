import { initPohObject, PohObject } from './common'
import { TypeClass, TypeObject } from '@/types/typeObjects'
import { useObjectsStore } from '@/stores/objects'

export type GameClass =
  'agenda' |
  'building' |
  'citizen' |
  'city' |
  'culture' |
  'deal' |
  'event' |
  'improvement' |
  'nationalWonder' |
  'player' |
  'relation' |
  'religion' |
  'revolution' |
  'technology' |
  'tile' |
  'tradeRoute' |
  'unit' |
  'unitDesign' |
  'world' |
  'worldWonder'

export interface GameObject extends PohObject {
  objType: 'GameObject'
  class: TypeClass
  type?: TypeObject

  city?: string // Citizen, Religion, Tile, Unit
  culture?: string // Citizen, Player
  player?: string // City, Tile, Unit
  religion?: string // Citizen, Player
  tile?: string // Citizen, Building, City, Improvement, Unit, 3x Wonders

  actions?: string[] // City, Unit
  citizens?: string[] // City, Culture, Policy, Religion, Tile
  tiles?: string[] // City, Player, TradeRoute
  tradeRoutes?: string[] // City, Player
  units?: string[] // City, Player, Tile

  canAttack?: boolean // City, Unit
  health?: number // Building, City, Improvement, Unit, 2x Wonders
  isCurrent?: boolean // Player, Unit

  resourceStorage?: Record<string, number> // City, Player
  stockpileStorage?: Record<string, number> // Player
  yieldStorage?: Record<string, number> // City, Player

  // Citizen
  policy?: string

  // Culture
  heritages?: string[]
  traits?: string[]

  // Deal
  startTurn?: number
  endTurn?: number
  items?: {
    to: string
    from: string
    type: string
    amount: number
    value: number
  }[]

  // Player
  agendas?: string[]
  cities?: string[]
  deals?: string[]
  policies?: string[]
  relations?: string[]
  technologies?: string[]
  unitDesigns?: string[]
  currentResearch?: string
  corruptionDisorder?: number
  electionsOnTurn?: number | null
  leader?: string
  policyUnhappiness?: number

  // Relation
  trust?: { amount: number, from: string }[]
  friendship?: { amount: number, from: string }[]
  strength?: number
  distance?: number

  // Technology
  isResearched?: boolean
  researchedAmount?: number

  // Unit
  design?: string
  isLevy?: boolean
  isMercenary?: boolean
  isMobilized?: boolean
  moves?: number
}

export function initGameObject (data: any): GameObject {
  const obj = initPohObject('GameObject', {
      // name may not exist in data, so set it to empty string by default
      name: '',
      ...data
    }
  ) as GameObject

  // Load TypeObject if present and set the name from it
  if ('type' in data) {
    obj.type = useObjectsStore().getTypeObject(data.type)
    if (!obj.name) {
      obj.name = obj.type.name
    }
  }

  return obj
}

export interface Tile extends GameObject {
  x: number
  y: number
  domain: string
  area: string
  terrain: string
  elevation: string
  feature?: string
  river?: string
  resource?: string
  route?: string
  player?: string
  construction?: string
  pollution?: string
  citizens: string[]
  tradeRoutes: string[]
  units: string[]
}

export interface TileObject extends GameObject {
  tile: string
}

export interface Resource extends TileObject {
  type: TypeObject
  amount: number
}

export interface Route extends TileObject {
  type: TypeObject
  health: number
}

export interface City extends TileObject {
  player: string
  health: number
  citizens: string[]
  units: string[]
}

export interface Building extends TileObject {
  type: TypeObject
  health: number
  citizens: string[]
}

export interface Improvement extends TileObject {
  type: TypeObject
  health: number
  citizen?: string
}

export interface Citizen extends TileObject {
  city: string
  culture: string
  religion?: string
  policy?: string
  workplace?: string
}

export interface TradeRoute extends GameObject {
  player: string
  unit: string
  tiles: string[]
}

export interface Unit extends TileObject {
  design: string
  player: string
  originalPlayer?: string
  health: number
  moves: number
  city?: string
  tradeRoute?: string
  isLevy: boolean
  isMercenary: boolean
  isMobilized: boolean
}

export interface UnitDesign extends GameObject {
  player: string
  equipment: string
  platform: string
  isArmored: boolean
  isActive: boolean
}

