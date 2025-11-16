import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { reactive } from 'vue'
import getIcon from '@/types/icons'
import { CategoryClass, CategoryObject, TypeClass, TypeObject } from '@/types/typeObjects'
import { GameClass, GameObject, Tile } from '@/types/gameObjects'

export type ObjType = 'TypeObject' | 'CategoryObject' | 'GameObject'
export type CatKey = `${CategoryClass}:${string}`
export type TypeKey = `${TypeClass}:${string}`
export type GameKey = `${GameClass}:${string}`
export type ObjKey = CatKey | TypeKey | GameKey

export function classAndId (key: string): { class: CategoryClass | TypeClass | GameClass, id: string } {
  const [c, i] = key.split(':')
  return { class: c as CategoryClass | TypeClass | GameClass, id: i }
}

export interface PohObject {
  objType: ObjType
  class: CategoryClass | TypeClass | GameClass
  id: string
  key: ObjKey
  name: string
  concept: `conceptType:${string}`
  icon: ObjectIcon
}

export function initPohObject (objType: ObjType, data: any): PohObject {
  return {
    objType,
    ...classAndId(data.key),
    key: data.key,
    name: data.name ?? '',
    concept: data.concept,
    icon: getIcon(data.key, data.concept, data.category),
  }
}

export function isCategoryObject (o: PohObject): o is CategoryObject {
  return o.objType === 'CategoryObject'
}

export function isTypeObject (o: PohObject): o is TypeObject {
  return o.objType === 'TypeObject'
}

export function isGameObject (o: PohObject): o is GameObject {
  return o.objType === 'GameObject'
}

export type World = {
  id: string,
  sizeX: number,
  sizeY: number,
  turn: number,
  year: number,
  currentPlayer: GameKey
  tiles: Record<`${number},${number}`, Tile>
}

export type ObjectIcon = {
  icon: IconDefinition,
  color: string
}

export type Yield = {
  type: TypeKey
  amount: number
  method: string
  for: TypeKey[]
  vs: TypeKey[]
}

export class TypeStorage {
  private _items = reactive<Record<TypeKey, number>>({})

  has (key: TypeKey, amount?: number): boolean {
    if (!(key in this._items)) return false

    return amount === undefined ? true : this._items[key] >= amount
  }

  amount (key: TypeKey): number {
    return this._items[key] ?? 0
  }

  add (key: TypeKey, amount: number): TypeStorage {
    this._items[key] = (this._items[key] ?? 0) + amount

    return this
  }

  take (key: TypeKey, amount: number): TypeStorage {
    this._items[key] = Math.max(0, (this._items[key] ?? 0) - amount)

    return this
  }

  takeUpTo (key: TypeKey, amount: number): number {
    const available = this.amount(key)
    const taken = Math.min(available, amount)
    this._items[key] = available - taken

    return taken
  }

  load (yields: Record<TypeKey, number>): TypeStorage {
    Object.assign(this._items, yields)

    return this
  }

  toJson (): Record<TypeKey, number> {
    return this._items
  }
}

export const yearsPerTurnConfig = [
  { start: -10000, end: -7000, yearsPerTurn: 60 },
  { start: -7000, end: -4000, yearsPerTurn: 60 },
  { start: -4000, end: -2500, yearsPerTurn: 30 },
  { start: -2500, end: -1000, yearsPerTurn: 30 },
  { start: -1000, end: -250, yearsPerTurn: 15 },
  { start: -250, end: 500, yearsPerTurn: 15 },
  { start: 500, end: 1000, yearsPerTurn: 10 },
  { start: 1000, end: 1400, yearsPerTurn: 8 },
  { start: 1400, end: 1600, yearsPerTurn: 4 },
  { start: 1600, end: 1700, yearsPerTurn: 2 },
  { start: 1700, end: 1775, yearsPerTurn: 1.5 },
  { start: 1775, end: 1850, yearsPerTurn: 1.5 },
  { start: 1850, end: 1900, yearsPerTurn: 1 },
  { start: 1900, end: 1950, yearsPerTurn: 1 },
  { start: 1950, end: 1975, yearsPerTurn: 0.5 },
  { start: 1975, end: 2000, yearsPerTurn: 0.5 },
  { start: 2000, end: 2015, yearsPerTurn: 0.333 },
  { start: 2015, end: 2030, yearsPerTurn: 0.333 },
  { start: 2030, end: 99999999, yearsPerTurn: 0.333 },
]
