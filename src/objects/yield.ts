import { ObjKey, TypeKey } from "@/types/common";
import { TypeObject } from "@/types/typeObjects";
import { TypeStorage } from "@/objects/storage";

export type YieldMethod = "lump" | "percent" | "set";
export type Yield = {
  type: TypeKey;
  amount: number;
  method: YieldMethod;
  for: ObjKey[];
  vs: ObjKey[];
  max?: number;
};

// noinspection RedundantIfStatementJS
export class Yields {
  // Organize yields by method and yield type
  private _lump: Record<TypeKey, Yield[]> = {};
  private _percent: Record<TypeKey, Yield[]> = {};
  private _set: Record<TypeKey, Yield[]> = {};

  private _all: Yield[] = [];

  constructor(yields: Yield[] = []) {
    this.add(...yields);
  }

  get lump(): Record<TypeKey, Yield[]> {
    return this._lump;
  }

  get percent(): Record<TypeKey, Yield[]> {
    return this._percent;
  }

  get set(): Record<TypeKey, Yield[]> {
    return this._set;
  }

  get isEmpty(): boolean {
    return this._all.length === 0;
  }

  static fromTypes(types: TypeObject[]): Yields {
    const yields = [] as Yield[];
    for (const t of types) {
      yields.push(...t.yields.all());
    }
    return new Yields(yields);
  }

  private _round(n: number): number {
    return Math.round(n * 10) / 10;
  }

  add(...yields: Yield[]): Yields {
    for (const y of yields) {
      const list = (this[`_${y.method}`][y.type] ??= []);
      list.push(y);
      this._all.push(y);
    }

    return this;
  }

  all(): Yield[] {
    // Return a copy of the array to prevent accidental mutation
    return this._all.slice();
  }

  applyMods(): Yields {
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
      } as Record<YieldMethod, Record<TypeKey, Record<ObjKey, number>>>,

      // eg {'lump': {'yieldType:strength': {'platformType:human': 12}}}
      vs: {
        lump: {},
        percent: {},
        set: {},
      } as Record<YieldMethod, Record<TypeKey, Record<ObjKey, number>>>,
    };

    // 2) Separate yields into lump/percent/set and any/for/vs
    for (const y of this._all) {
      if (y.for.length > 0) {
        for (const forKey of y.for) {
          const sep = (separated.for[y.method][y.type] ??= {});
          sep[forKey] = (sep[forKey] ?? 0) + y.amount;
        }
      }

      if (y.vs.length > 0) {
        for (const vsKey of y.vs) {
          const sep = (separated.vs[y.method][y.type] ??= {});
          sep[vsKey] = (sep[vsKey] ?? 0) + y.amount;
        }
      }

      if (y.for.length + y.vs.length === 0) {
        const sep = separated.any[y.method];
        sep[y.type] = (sep[y.type] ?? 0) + y.amount;
      }
    }

    // 3) Init merged values
    const values = {
      // eg {'yieldType:strength': 12}
      any: {} as Record<TypeKey, number>,

      // eg {'yieldType:moves': {'platformType:human': 1}}
      for: {} as Record<TypeKey, Record<ObjKey, number>>,

      // eg {'yieldType:strength': {'platformType:tracked': 50}}
      vs: {} as Record<TypeKey, Record<ObjKey, number>>,
    };

    // 4) "Set" overrides lump and percent, so add them first
    for (const target of ["any", "for", "vs"]) {
      const targetKey = target as "any" | "for" | "vs";
      const separatedTarget = separated[targetKey];

      for (const [yieldTypeStr, amountPerType] of Object.entries(separatedTarget.set)) {
        const yieldTypeKey = yieldTypeStr as TypeKey;

        // Dealing with any -> the amount is a number
        if (targetKey === "any") {
          values.any[yieldTypeKey] = amountPerType as number;
          continue;
        }

        // Dealing with for/vs. -> add amount per TypeKey
        const targetValues = (values[targetKey][yieldTypeKey] ??= {});
        for (const [forKey, amount] of Object.entries(amountPerType as Record<TypeKey, number>)) {
          targetValues[forKey as TypeKey] = amount;
        }
      }
    }

    // 5) Add Lump + Percent into the values (skip if already set)

    // 5.1) Add 'any' target first
    for (const [yieldTypeKey, amount] of Object.entries(separated.any.lump)) {
      // amount already in values.any[yieldTypeKey] from "set", don't overwrite it
      if (yieldTypeKey in values.any) continue;

      const multiplier = 1 + (separated.any.percent[yieldTypeKey as TypeKey] ?? 0) / 100;

      values.any[yieldTypeKey as TypeKey] = this._round(amount * multiplier);
    }

    // 5.2) Add 'for' and 'vs' targets next
    for (const targetStr of ["for", "vs"]) {
      const targetKey = targetStr as "for" | "vs";
      const targetSeparated = separated[targetKey];
      const targetValues = values[targetKey];

      for (const [yieldTypeStr, amountPerType] of Object.entries(targetSeparated.lump)) {
        const yieldTypeKey = yieldTypeStr as TypeKey;

        for (const [typeStr, amount] of Object.entries(amountPerType)) {
          const typeKey = typeStr as TypeKey;

          // amount already in values.for[yieldTypeKey][forKey] from "set", don't overwrite it
          if (typeKey in targetValues[yieldTypeKey]) continue;

          const sepPercent = targetSeparated.percent[yieldTypeKey] ?? {};
          const multiplier = 1 + (sepPercent[typeKey] ?? 0) / 100;

          if (!(yieldTypeKey in targetValues)) targetValues[yieldTypeKey] = {};
          targetValues[yieldTypeKey][typeKey] = this._round(amount * multiplier);
        }
      }
    }

    // 6) Convert values into Yield objects

    // 6.1) Add 'any' target first
    const yields = Object.entries(values.any).map(
      ([yieldType, amount]): Yield => ({
        type: yieldType as TypeKey,
        amount,
        method: "lump",
        for: [],
        vs: [],
      }),
    );

    // 6.2) Add 'for' and 'vs' targets next
    for (const target of ["for", "vs"]) {
      const targetValues = values[target as "for" | "vs"];
      for (const [yieldType, amountPerType] of Object.entries(targetValues)) {
        for (const [objType, amount] of Object.entries(amountPerType)) {
          yields.push({
            type: yieldType as TypeKey,
            amount,
            method: "lump",
            for: target === "for" ? [objType] : [],
            vs: target === "vs" ? [objType] : [],
          } as Yield);
        }
      }
    }

    return new Yields(yields);
  }

  only(yieldTypes: TypeKey[] = [], forObjs: TypeObject[] = [], vsObjs: TypeObject[] = []): Yields {
    return new Yields(
      this._all.filter((y) => {
        if (yieldTypes.length > 0 && !this._yieldInTypes(y, yieldTypes)) return false;
        if (forObjs.length > 0 && !this._yieldIsForObjs(y, forObjs)) return false;
        if (vsObjs.length > 0 && !this._yieldIsVsObjs(y, vsObjs)) return false;

        return true;
      }),
    );
  }

  not(yieldTypes: TypeKey[] = [], forObjs: TypeObject[] = [], vsObjs: TypeObject[] = []): Yields {
    return new Yields(
      this._all.filter((y) => {
        if (yieldTypes.length > 0 && this._yieldInTypes(y, yieldTypes)) return false;
        if (forObjs.length > 0 && this._yieldIsForObjs(y, forObjs)) return false;
        if (vsObjs.length > 0 && this._yieldIsVsObjs(y, vsObjs)) return false;

        return true;
      }),
    );
  }

  protected _yieldInTypes(y: Yield, yieldTypes: TypeKey[]): boolean {
    return yieldTypes.includes(y.type);
  }

  protected _yieldIsForObjs(y: Yield, objs: TypeObject[]): boolean {
    return objs.some(
      (t) =>
        y.for.length === 0 ||
        y.for.includes(t.key) ||
        (t.category && y.for.includes(t.category)) ||
        y.for.includes(`conceptType:${t.class}`),
    );
  }

  protected _yieldIsVsObjs(y: Yield, objs: TypeObject[]): boolean {
    return objs.some(
      (t) =>
        y.vs.length === 0 ||
        y.vs.includes(t.key) ||
        (t.category && y.vs.includes(t.category)) ||
        y.vs.includes(`conceptType:${t.class}`),
    );
  }

  getLumpAmount(type: TypeKey): number {
    return this._round(this._lump[type]?.reduce((a, y) => a + y.amount, 0) ?? 0);
  }

  getPercentAmount(type: TypeKey): number {
    return this._round(this._percent[type]?.reduce((a, y) => a + y.amount, 0) ?? 0);
  }

  getSetAmount(type: TypeKey): number {
    return this._round(this._set[type]?.reduce((a, y) => a + y.amount, 0) ?? 0);
  }

  merge(yields: Yields): Yields {
    return new Yields(this._all).add(...yields.all());
  }

  toStorage(): TypeStorage {
    // Only return lump
    const storage = new TypeStorage();

    Object.values(this._lump).forEach((yields) =>
      yields.forEach((y) => (y.method === "lump" ? storage.add(y.type, y.amount) : null)),
    );

    return storage;
  }
}
