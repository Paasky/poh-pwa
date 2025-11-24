import { roundToTenth, TypeKey } from '@/types/common'
import { ref } from 'vue'

export class TypeStorage {
  private _items = ref({} as Record<TypeKey, number>)

  has (key: TypeKey, amount?: number): boolean {
    if (!(key in this._items.value)) return false

    return amount === undefined ? true : this._items.value[key] >= amount
  }

  amount (key: TypeKey): number {
    return this._items.value[key] ?? 0
  }

  add (key: TypeKey, amount: number): TypeStorage {
    this._items.value[key] = roundToTenth((this._items.value[key] ?? 0) + amount)

    return this
  }

  take (key: TypeKey, amount: number): TypeStorage {
    if (!this.has(key, amount)) throw new Error(
      `Not enough ${key} in storage: ${this._items.value[key] ?? 0} < ${amount}`
    )
    this._items.value[key] = roundToTenth(this._items.value[key] - amount)

    return this
  }

  takeAll (key: TypeKey): number {
    const amount = this._items.value[key] ?? 0
    this._items.value[key] = 0

    return amount
  }

  takeUpTo (key: TypeKey, amount: number): number {
    const available = this.amount(key)
    const taken = Math.min(available, amount)
    this._items.value[key] = roundToTenth(available - taken)

    return taken
  }

  load (yields: Record<TypeKey, number>): TypeStorage {
    for (const [key, amount] of Object.entries(yields)) {
      if (amount > 0) this._items.value[key as TypeKey] = roundToTenth(amount)
    }

    return this
  }

  toJson (): Record<TypeKey, number> {
    return this._items.value
  }
}