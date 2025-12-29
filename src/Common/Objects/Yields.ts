import { ObjKey, roundToTenth, TypeKey } from "@/Common/Objects/Common";
import { objectIsAnyOfKeys, TypeObject } from "@/Common/Objects/TypeObject";
import { TypeStorage } from "@/Common/Objects/TypeStorage";

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

  // Applies all "set" and "percent" yields into single "lump" output
  // If no types are given, all types will be included
  // If no "forObjs"/"vsObjs" are given, all "for"/"vs" yields will be dropped
  // If no "forObjs"/"vsObjs" are given, any "for"/"vs" yields not in "forObjs"/"vsObjs" will be dropped
  // Returns a new Yields object
  flatten(
    yieldTypes: TypeKey[] = [],
    forObjs: TypeObject[] = [],
    vsObjs: TypeObject[] = [],
  ): Yields {
    const lumpYields = {} as Record<TypeKey, number>;
    const percentYields = {} as Record<TypeKey, number>;
    const setYields = {} as Record<TypeKey, number>;

    for (const y of this._all) {
      // If YieldTypes filter was given & doesn't pass -> skip
      if (yieldTypes.length > 0 && !this._yieldInTypes(y, yieldTypes)) continue;

      // If it's only "for" something: no "for" given, or filter doesn't pass -> skip
      if (y.for.length && (!forObjs.length || !this._yieldIsForTypes(y, forObjs))) continue;

      // If it's only "vs" something: no "for" given, or filter doesn't pass -> skip
      if (y.vs.length && (!vsObjs.length || !this._yieldIsVsTypes(y, vsObjs))) continue;

      if (y.method === "lump") {
        lumpYields[y.type] = (lumpYields[y.type] ?? 0) + y.amount;
      }
      if (y.method === "percent") {
        percentYields[y.type] = (percentYields[y.type] ?? 0) + y.amount;
      }
      if (y.method === "set") {
        // "set doesn't accumulate
        setYields[y.type] = y.amount;
      }
    }

    const yields = [] as Yield[];
    for (const [type, amount] of Object.entries(setYields)) {
      // "set" overrides any lump/percent
      delete lumpYields[type as TypeKey];
      delete percentYields[type as TypeKey];

      // add "set" as lump yield
      yields.push({
        type: type as TypeKey,
        amount: roundToTenth(amount),
        method: "lump",
        for: [],
        vs: [],
      });
    }

    for (const [type, amount] of Object.entries(lumpYields)) {
      // Use percent as extra multiplier
      const multiplier = (100 + (percentYields[type as TypeKey] ?? 0)) / 100;

      // add combined "lump" and "percent" as lump yield
      yields.push({
        type: type as TypeKey,
        amount: roundToTenth(amount * multiplier),
        method: "lump",
        for: [],
        vs: [],
      });
    }

    return new Yields(yields);
  }

  only(yieldTypes: TypeKey[] = [], forObjs: TypeObject[] = [], vsObjs: TypeObject[] = []): Yields {
    return new Yields(
      this._all.filter((y) => {
        if (yieldTypes.length > 0 && !this._yieldInTypes(y, yieldTypes)) return false;
        if (forObjs.length > 0 && !this._yieldIsForTypes(y, forObjs)) return false;
        if (vsObjs.length > 0 && !this._yieldIsVsTypes(y, vsObjs)) return false;

        return true;
      }),
    );
  }

  not(yieldTypes: TypeKey[] = [], forObjs: TypeObject[] = [], vsObjs: TypeObject[] = []): Yields {
    return new Yields(
      this._all.filter((y) => {
        if (yieldTypes.length > 0 && this._yieldInTypes(y, yieldTypes)) return false;
        if (forObjs.length > 0 && this._yieldIsForTypes(y, forObjs)) return false;
        if (vsObjs.length > 0 && this._yieldIsVsTypes(y, vsObjs)) return false;

        return true;
      }),
    );
  }

  protected _yieldInTypes(y: Yield, yieldTypes: TypeKey[]): boolean {
    return yieldTypes.includes(y.type);
  }

  protected _yieldIsForTypes(y: Yield, types: TypeObject[]): boolean {
    return types.some((type) => y.for.length === 0 || objectIsAnyOfKeys(type, y.for));
  }

  protected _yieldIsVsTypes(y: Yield, types: TypeObject[]): boolean {
    return types.some((type) => y.vs.length === 0 || objectIsAnyOfKeys(type, y.vs));
  }

  getLumpAmount(type: TypeKey): number {
    return roundToTenth(this._lump[type]?.reduce((a, y) => a + y.amount, 0) ?? 0);
  }

  getPercentAmount(type: TypeKey): number {
    return roundToTenth(this._percent[type]?.reduce((a, y) => a + y.amount, 0) ?? 0);
  }

  getSetAmount(type: TypeKey): number {
    return roundToTenth(this._set[type]?.reduce((a, y) => a + y.amount, 0) ?? 0);
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
