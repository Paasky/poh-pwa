// Immutable, fast O(1) lookup storage for yields per player
// Built from raw API entries like { key: string, amount: number }

export interface YieldStorageEntry {
  key: string
  amount: number
}

export class YieldStorage {
  private readonly map: Readonly<Record<string, number>>

  constructor(entries: ReadonlyArray<YieldStorageEntry> | null | undefined) {
    const m: Record<string, number> = {}
    if (Array.isArray(entries)) {
      for (const e of entries) {
        if (!e || typeof e.key !== 'string') continue
        const amt = typeof e.amount === 'number' && Number.isFinite(e.amount) ? e.amount : 0
        m[e.key] = amt
      }
    }
    this.map = Object.freeze(m)
    Object.freeze(this)
  }

  // Return the stored amount for a given key, or 0 if missing
  get(key: string): number {
    return this.map[key] ?? 0
  }

  // Optional helpers (could be useful later)
  keys(): readonly string[] { return Object.freeze(Object.keys(this.map)) }
  size(): number { return Object.keys(this.map).length }
}
