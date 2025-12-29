import { roundToTenth, TypeKey } from "@/Common/Objects/Common";

export class TypeStorage {
  private _items: Record<TypeKey, number> = {};

  has(key: TypeKey, amount?: number): boolean {
    if (!(key in this._items)) return false;

    return amount === undefined ? true : this._items[key] >= amount;
  }

  amount(key: TypeKey): number {
    return this._items[key] ?? 0;
  }

  add(key: TypeKey, amount: number): TypeStorage {
    this._items[key] = roundToTenth((this._items[key] ?? 0) + amount);

    return this;
  }

  take(key: TypeKey, amount: number): TypeStorage {
    if (!this.has(key, amount))
      throw new Error(`Not enough ${key} in storage: ${this._items[key] ?? 0} < ${amount}`);
    this._items[key] = roundToTenth(this._items[key] - amount);

    return this;
  }

  takeAll(key: TypeKey): number {
    const amount = this._items[key] ?? 0;
    this._items[key] = 0;

    return amount;
  }

  takeUpTo(key: TypeKey, amount: number): number {
    const available = this.amount(key);
    const taken = Math.min(available, amount);
    this._items[key] = roundToTenth(available - taken);

    return taken;
  }

  all(): Record<TypeKey, number> {
    return this._items;
  }

  load(yields: Record<TypeKey, number>): TypeStorage {
    for (const [key, amount] of Object.entries(yields)) {
      if (amount > 0) this._items[key as TypeKey] = roundToTenth(amount);
    }

    return this;
  }

  toJson(): Record<TypeKey, number> {
    return this._items;
  }
}
