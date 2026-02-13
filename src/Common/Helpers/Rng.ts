import seedrandom from "seedrandom";

export class Rng {
  private _engine!: seedrandom.PRNG;
  private _mockValues: number[] | null = null;
  private _mockIndex: number = 0;

  constructor(seed?: string | number) {
    this.seed(seed);
  }

  /** Returns a float between 0 and 1 */
  next(): number {
    if (this._mockValues !== null) {
      if (this._mockIndex >= this._mockValues.length) {
        throw new Error(`Rng.mock: exhausted values at index ${this._mockIndex}.`);
      }
      return this._mockValues[this._mockIndex++];
    }
    return this._engine();
  }

  /** Re-initializes the engine with a new seed */
  seed(seed?: string | number | null): void {
    // If seed is null/undefined, it uses current time/entropy
    this._engine = seedrandom(seed?.toString(), { state: true });
    this.unmock();
  }

  /** Enters mock mode. Throws if exhausted. Returns a cleanup function. */
  mock(values: number[]): () => void {
    this._mockValues = values;
    this._mockIndex = 0;
    return () => this.unmock();
  }

  /** Exits mock mode and returns to seeded/random generation. */
  unmock(): void {
    this._mockValues = null;
    this._mockIndex = 0;
  }

  /** Returns engine state for serialization. */
  getState(): object {
    return this._engine.state();
  }

  /** Restores engine state. */
  setState(state: object): void {
    this._engine = seedrandom("", { state });
    this.unmock();
  }

  /* Utility Methods */

  /** Returns a float between min and max */
  between(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Returns an integer between min (inclusive) and max (inclusive) */
  intBetween(min: number, max: number): number {
    return Math.floor(this.between(min, max + 1));
  }

  /** Returns true with a given probability (0.0 to 1.0) */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Returns a random item from an array, Set, or Map */
  pick<T>(collection: T[] | Set<T> | Map<unknown, T>): T | undefined {
    const size = this._getSize(collection);
    if (size === 0) return undefined;

    const index = this.intBetween(0, size - 1);

    if (Array.isArray(collection)) {
      return collection[index];
    }

    let i = 0;
    const values = collection instanceof Map ? collection.values() : collection;
    for (const item of values) {
      if (i === index) return item as T;
      i++;
    }
    return undefined;
  }

  /** Returns N unique random items from a collection */
  pickMany<T>(collection: T[] | Set<T> | Map<unknown, T>, count: number): T[] {
    const size = this._getSize(collection);
    if (count > size) {
      throw new Error(`Rng.pickMany: requested ${count} items but collection only has ${size}.`);
    }

    const items = this._toValueArray(collection);
    return this.takeMany(items, count);
  }

  /** Removes and returns a random item from the collection.
   * Note: For Set and Map, this mutates the collection. For Array, it uses splice.
   */
  take<T>(collection: T[] | Set<T> | Map<unknown, T>): T | undefined {
    const size = this._getSize(collection);
    if (size === 0) return undefined;

    const index = this.intBetween(0, size - 1);

    if (Array.isArray(collection)) {
      return collection.splice(index, 1)[0];
    }

    if (collection instanceof Set) {
      let i = 0;
      for (const item of collection) {
        if (i === index) {
          collection.delete(item);
          return item as T;
        }
        i++;
      }
    }

    if (collection instanceof Map) {
      let i = 0;
      for (const [key, value] of collection.entries()) {
        if (i === index) {
          collection.delete(key);
          return value;
        }
        i++;
      }
    }

    return undefined;
  }

  /** Removes and returns N random items from the array. */
  takeMany<T>(array: T[], count: number): T[] {
    if (array.length < count) {
      throw new Error(`Rng.takeMany: requested ${count} items but array only has ${array.length}.`);
    }
    const out: T[] = [];
    while (out.length < count) {
      const item = this.take(array);
      if (item !== undefined) out.push(item);
    }
    return out;
  }

  /** Shuffles an array in-place */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.intBetween(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /** Returns value +/- a random amount up to jitter */
  jitter(value: number, amount: number): number {
    return value + (this.next() - 0.5) * 2 * amount;
  }

  private _getSize(collection: unknown): number {
    if (Array.isArray(collection)) return collection.length;
    if (collection instanceof Set || collection instanceof Map) return collection.size;
    return 0;
  }

  private _toValueArray<T>(collection: T[] | Set<T> | Map<unknown, T>): T[] {
    if (Array.isArray(collection)) return [...collection];
    if (collection instanceof Set) return [...collection];
    if (collection instanceof Map) return [...collection.values()];
    return [];
  }
}

export const rng = new Rng();
