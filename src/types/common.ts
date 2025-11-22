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
    ...data,
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

export class Requires {
  private _requireAll: ObjKey[] = []
  private _requireAny: ObjKey[][] = []
  private _allTypes: ObjKey[] = []

  constructor (requires: ObjKey[] | ObjKey[][] = []) {
    for (const r of requires) {
      if (Array.isArray(r)) {
        this._requireAny.push(r)
        this._allTypes.push(...r)
      } else {
        this._requireAll.push(r)
        this._allTypes.push(r)
      }
    }
  }

  get allTypes (): ObjKey[] { return this._allTypes }

  get isEmpty (): boolean { return this._allTypes.length === 0 }

  get requireAll (): ObjKey[] { return this._requireAll }

  get requireAny (): ObjKey[][] { return this._requireAny }

  isSatisfied (types: TypeObject[]): boolean {
    // Need to check type.key, type.category && type.concept

    // At least one of the given objects must match each "require all"-keys
    for (const require of this._requireAll) {
      if (!types.some(
        t => t.key === require || t.category === require || t.concept === require
      )) return false
    }

    // At least one of the given objects must match any "require any"-key
    for (const require of this._requireAny) {
      if (!types.some(
        t => require.includes(t.key) || (t.category && require.includes(t.category)) || require.includes(t.concept)
      )) return false
    }

    // Both checks pass
    return true
  }

  filter (classes: TypeClass[]): Requires {
    const all: ObjKey[] = []
    const any: ObjKey[][] = []

    for (const req of this._requireAll) {
      if (classes.some(c => req.startsWith(`${c}:`))) {
        all.push(req)
      }
    }

    for (const reqAny of this._requireAny) {
      for (const req of reqAny) {
        if (classes.some(c => req.startsWith(`${c}:`))) {
          any.push(reqAny)
          break
        }
      }
    }

    return new Requires([...all, ...any] as ObjKey[] | ObjKey[][])
  }
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

export type YieldMethod = 'lump' | 'percent' | 'set'
export type Yield = {
  type: TypeKey
  amount: number
  method: YieldMethod
  for: TypeKey[]
  vs: TypeKey[]
}

export class Yields {
  // Organize yields by method and yield type
  private _lump: Record<TypeKey, Yield[]> = {}
  private _percent: Record<TypeKey, Yield[]> = {}
  private _set: Record<TypeKey, Yield[]> = {}

  constructor (yields: Yield[] = []) {
    this.add(...yields)
  }

  get lump (): Record<TypeKey, Yield[]> { return this._lump }

  get percent (): Record<TypeKey, Yield[]> { return this._percent }

  get set (): Record<TypeKey, Yield[]> { return this._set }

  get isEmpty (): boolean {
    return Object.values(this._lump).length
      + Object.values(this._percent).length
      + Object.values(this._set).length
      === 0
  }

  static fromTypes (types: TypeObject[]): Yields {
    return new Yields(
      types.flatMap(t => t.yields.all())
    )
  }

  private _round (n: number): number {
    return Math.round(n * 10) / 10
  }

  add (...yields: Yield[]): Yields {
    for (const y of yields) {
      const list = this[`_${y.method}`][y.type] ??= []
      list.push(y)
    }

    return this
  }

  all (): Yield[] {
    return Object.values(this._lump).flatMap(l => l)
      .concat(Object.values(this._percent).flatMap(p => p))
      .concat(Object.values(this._set).flatMap(s => s))
  }

  applyMods (): Yields {

    // 1) Init separated objects
    const separated = {

      // eg {'lump': {'yieldType:strength': 12}}
      any: {
        lump: {},
        percent: {},
        set: {},
      } as Record<YieldMethod, Record<TypeKey, number>>,

      // eg {'lump': {'yieldType:strength': {'platformType:human': 12}}}
      for: {
        lump: {},
        percent: {},
        set: {},
      } as Record<YieldMethod, Record<TypeKey, Record<TypeKey, number>>>,

      // eg {'lump': {'yieldType:strength': {'platformType:human': 12}}}
      vs: {
        lump: {},
        percent: {},
        set: {},
      } as Record<YieldMethod, Record<TypeKey, Record<TypeKey, number>>>,
    }

    // 2) Separate yields into lump/percent/set and any/for/vs
    for (const y of this.all()) {
      if (y.for.length > 0) {
        for (const forKey of y.for) {
          const sep = separated.for[y.method][y.type] ??= {}
          sep[forKey] = (sep[forKey] ?? 0) + y.amount
        }
      }

      if (y.vs.length > 0) {
        for (const vsKey of y.vs) {
          const sep = separated.vs[y.method][y.type] ??= {}
          sep[vsKey] = (sep[vsKey] ?? 0) + y.amount
        }
      }

      if (y.for.length + y.vs.length === 0) {
        const sep = separated.any[y.method]
        sep[y.type] = (sep[y.type] ?? 0) + y.amount
      }
    }

    // 3) Init merged values
    const values = {

      // eg {'yieldType:strength': 12}
      any: {} as Record<TypeKey, number>,

      // eg {'yieldType:moves': {'platformType:human': 1}}
      for: {} as Record<TypeKey, Record<TypeKey, number>>,

      // eg {'yieldType:strength': {'platformType:tracked': 50}}
      vs: {} as Record<TypeKey, Record<TypeKey, number>>,
    }

    // 4) "Set" overrides lump and percent, so add them first
    for (const target of ['any', 'for', 'vs']) {
      const targetKey = target as 'any' | 'for' | 'vs'
      const separatedTarget = separated[targetKey]

      for (const [yieldTypeStr, amountPerType] of Object.entries(separatedTarget.set)) {
        const yieldTypeKey = yieldTypeStr as TypeKey

        // Dealing with any -> the amount is a number
        if (targetKey === 'any') {
          values.any[yieldTypeKey] = amountPerType as number
          continue
        }

        // Dealing with for/vs. -> add amount per TypeKey
        const targetValues = values[targetKey][yieldTypeKey] ??= {}
        for (const [forKey, amount] of Object.entries(amountPerType as Record<TypeKey, number>)) {
          targetValues[forKey as TypeKey] = amount
        }
      }
    }

    // 5) Add Lump + Percent into the values (skip if already set)

    // 5.1) Add 'any' target first
    for (const [yieldTypeKey, amount] of Object.entries(separated.any.lump)) {

      // amount already in values.any[yieldTypeKey] from "set", don't overwrite it
      if (yieldTypeKey in values.any) continue

      const multiplier = 1 + ((separated.any.percent[yieldTypeKey as TypeKey] ?? 0) / 100)

      values.any[yieldTypeKey as TypeKey] = this._round(amount * multiplier)
    }

    // 5.2) Add 'for' and 'vs' targets next
    for (const targetStr of ['for', 'vs']) {
      const targetKey = targetStr as 'for' | 'vs'
      const targetSeparated = separated[targetKey]
      const targetValues = values[targetKey]

      for (const [yieldTypeStr, amountPerType] of Object.entries(targetSeparated.lump)) {
        const yieldTypeKey = yieldTypeStr as TypeKey

        for (const [typeStr, amount] of Object.entries(amountPerType)) {
          const typeKey = typeStr as TypeKey

          // amount already in values.for[yieldTypeKey][forKey] from "set", don't overwrite it
          if (typeKey in targetValues[yieldTypeKey]) continue

          const sepPercent = targetSeparated.percent[yieldTypeKey] ?? {}
          const multiplier = 1 + ((sepPercent[typeKey] ?? 0) / 100)

          if (!(yieldTypeKey in targetValues)) targetValues[yieldTypeKey] = {}
          targetValues[yieldTypeKey][typeKey] = this._round(amount * multiplier)
        }
      }
    }

    // 6) Convert values into Yield objects

    // 6.1) Add 'any' target first
    const yields = Object.entries(values.any).map(([yieldType, amount]): Yield => ({
      type: yieldType as TypeKey,
      amount,
      method: 'lump',
      for: [],
      vs: [],
    }))

    // 6.2) Add 'for' and 'vs' targets next
    for (const target of ['for', 'vs']) {
      const targetValues = values[target as 'for' | 'vs']
      for (const [yieldType, amountPerType] of Object.entries(targetValues)) {
        for (const [objType, amount] of Object.entries(amountPerType)) {
          yields.push({
            type: yieldType as TypeKey,
            amount,
            method: 'lump',
            for: target === 'for' ? [objType] : [],
            vs: target === 'vs' ? [objType] : [],
          } as Yield)
        }
      }
    }

    return new Yields(yields)
  }

  only (yieldTypes: TypeKey[] = [], forTypes: TypeKey[] = [], vsTypes: TypeKey[] = []): Yields {
    return new Yields(this.all().filter(y => {
      if (yieldTypes.length > 0 && !yieldTypes.includes(y.type)) return false

      if (forTypes.length > 0 && !forTypes.some(
        t => y.for.length === 0 || y.for.includes(t)
      )) return false

      if (vsTypes.length > 0 && !vsTypes.some(
        t => y.vs.length === 0 || y.vs.includes(t)
      )) return false
    }))
  }

  not (yieldTypes: TypeKey[] = [], forTypes: TypeKey[] = [], vsTypes: TypeKey[] = []): Yields {
    return new Yields(this.all().filter(y => {
      if (yieldTypes.length > 0 && yieldTypes.includes(y.type)) return false

      if (forTypes.length > 0 && forTypes.some(
        t => y.for.length > 0 || y.for.includes(t)
      )) return false

      if (vsTypes.length > 0 && vsTypes.some(
        t => y.vs.length > 0 || y.vs.includes(t)
      )) return false

      return true
    }))
  }

  getLumpAmount (type: TypeKey): number {
    return this._round(this._lump[type]?.reduce((a, y) => a + y.amount, 0) ?? 0)
  }

  getPercentAmount (type: TypeKey): number {
    return this._round(this._percent[type]?.reduce((a, y) => a + y.amount, 0) ?? 0)
  }

  getSetAmount (type: TypeKey): number {
    return this._round(this._set[type]?.reduce((a, y) => a + y.amount, 0) ?? 0)
  }

  merge (yields: Yields): Yields {
    this.add(...yields.all())

    return this
  }

  toStorage (): TypeStorage {
    // Only return lump
    const storage = new TypeStorage()

    Object.values(this._lump).forEach(
      yields => yields.forEach(
        y => y.method === 'lump'
          ? storage.add(y.type, y.amount)
          : null
      )
    )

    return storage
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
