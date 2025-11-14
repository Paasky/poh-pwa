import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { reactive } from 'vue'
import getIcon from '@/types/icons'
import { CategoryClass, CategoryObject, TypeClass, TypeObject } from '@/types/typeObjects'
import { GameClass, GameObject } from '@/types/gameObjects'

export type ObjType = 'TypeObject' | 'CategoryObject' | 'GameObject'
export type ObjKey = `${CategoryClass | TypeClass | GameClass}:${string}`

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

export interface ObjectIcon {
  icon: IconDefinition,
  color: string
}

export function classAndId (key: string): { class: CategoryClass | TypeClass | GameClass, id: string } {
  const [c, i] = key.split(':')
  return { class: c as CategoryClass | TypeClass | GameClass, id: i }
}

export interface Yield {
  type: string
  amount: number
  method: string
  for: string[]
  vs: string[]
}

export class TypeStorage {
  private _items = reactive<Record<string, number>>({})

  has (key: string, amount?: number): boolean {
    if (!(key in this._items)) return false

    return amount === undefined ? true : this._items[key] >= amount
  }

  amount (key: string): number {
    return this._items[key] ?? 0
  }

  add (key: string, amount: number): TypeStorage {
    this._items[key] = (this._items[key] ?? 0) + amount

    return this
  }

  take (key: string, amount: number): TypeStorage {
    this._items[key] = Math.max(0, (this._items[key] ?? 0) - amount)

    return this
  }

  takeUpTo (key: string, amount: number): number {
    const available = this.amount(key)
    const taken = Math.min(available, amount)
    this._items[key] = available - taken

    return taken
  }

  load (yields: Record<string, number>): TypeStorage {
    for (const [key, amount] of Object.entries(yields)) {
      this._items[key] = amount
    }

    return this
  }
}