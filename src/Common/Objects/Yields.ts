import { CatKey, ObjKey, roundToTenth, TypeKey } from "@/Common/Objects/Common";
import { objectIsAnyOfKeys, TypeObject } from "@/Common/Objects/TypeObject";
import { TypeStorage } from "@/Common/Objects/TypeStorage";
import { has, reduce } from "@/helpers/collectionTools";

export type YieldMethod = "lump" | "percent" | "set";

export type RawYield = {
  type: YieldTypeKey;
  amount?: number;
  method?: YieldMethod;
  for?: ObjKey[];
  vs?: ObjKey[];
};

export type Yield = {
  type: YieldTypeKey;
  amount: number;
  method: YieldMethod;
  for: Set<TypeKey | CatKey>;
  vs: Set<TypeKey | CatKey>;
  max?: number;
};

// noinspection RedundantIfStatementJS
export class Yields {
  // Organize yields by method and yield type
  private _lump: Map<YieldTypeKey, Yield[]> = new Map();
  private _percent: Map<YieldTypeKey, Yield[]> = new Map();
  private _set: Map<YieldTypeKey, Yield[]> = new Map();

  private _all: Yield[] = [];

  constructor(yields: Yield[] = []) {
    this.add(...yields);
  }

  get lump(): Map<YieldTypeKey, Yield[]> {
    return this._lump;
  }

  get percent(): Map<YieldTypeKey, Yield[]> {
    return this._percent;
  }

  get set(): Map<YieldTypeKey, Yield[]> {
    return this._set;
  }

  get isEmpty(): boolean {
    return this._all.length === 0;
  }

  static fromTypes(types: Set<TypeObject>): Yields {
    const yields = [] as Yield[];
    for (const t of types) {
      yields.push(...t.yields.all());
    }
    return new Yields(yields);
  }

  add(...yields: Yield[]): Yields {
    for (const y of yields) {
      const methodMap = this[`_${y.method}`];
      const yieldList = methodMap.get(y.type);
      if (yieldList) {
        yieldList.push(y);
      } else {
        methodMap.set(y.type, [y]);
      }
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
    yieldTypes: Set<YieldTypeKey> = new Set(),
    forObjs: Set<TypeObject> = new Set(),
    vsObjs: Set<TypeObject> = new Set(),
  ): Yields {
    const lumpYields = {} as Record<TypeKey, number>;
    const percentYields = {} as Record<TypeKey, number>;
    const setYields = {} as Record<TypeKey, number>;

    for (const y of this._all) {
      // If YieldTypes filter was given & doesn't pass -> skip
      if (yieldTypes.size > 0 && !this._yieldInTypes(y, yieldTypes)) continue;

      // If it's only "for" something: no "for" given, or filter doesn't pass -> skip
      if (y.for.size && (!forObjs.size || !this._yieldIsForTypes(y, forObjs))) continue;

      // If it's only "vs" something: no "for" given, or filter doesn't pass -> skip
      if (y.vs.size && (!vsObjs.size || !this._yieldIsVsTypes(y, vsObjs))) continue;

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
        type: type as YieldTypeKey,
        amount: roundToTenth(amount),
        method: "lump",
        for: new Set(),
        vs: new Set(),
      });
    }

    for (const [type, amount] of Object.entries(lumpYields)) {
      // Use percent as extra multiplier
      const multiplier = (100 + (percentYields[type as TypeKey] ?? 0)) / 100;

      // add combined "lump" and "percent" as lump yield
      yields.push({
        type: type as YieldTypeKey,
        amount: roundToTenth(amount * multiplier),
        method: "lump",
        for: new Set(),
        vs: new Set(),
      });
    }

    return new Yields(yields);
  }

  only(
    yieldTypes: Set<YieldTypeKey> = new Set(),
    forObjs: Set<TypeObject> = new Set(),
    vsObjs: Set<TypeObject> = new Set(),
  ): Yields {
    return new Yields(
      this._all.filter((y) => {
        if (yieldTypes.size > 0 && !this._yieldInTypes(y, yieldTypes)) return false;
        if (forObjs.size > 0 && !this._yieldIsForTypes(y, forObjs)) return false;
        if (vsObjs.size > 0 && !this._yieldIsVsTypes(y, vsObjs)) return false;

        return true;
      }),
    );
  }

  not(
    yieldTypes: Set<YieldTypeKey> = new Set(),
    forObjs: Set<TypeObject> = new Set(),
    vsObjs: Set<TypeObject> = new Set(),
  ): Yields {
    return new Yields(
      this._all.filter((y) => {
        if (yieldTypes.size > 0 && this._yieldInTypes(y, yieldTypes)) return false;
        if (forObjs.size > 0 && this._yieldIsForTypes(y, forObjs)) return false;
        if (vsObjs.size > 0 && this._yieldIsVsTypes(y, vsObjs)) return false;

        return true;
      }),
    );
  }

  protected _yieldInTypes(y: Yield, yieldTypes: Set<YieldTypeKey>): boolean {
    return yieldTypes.has(y.type);
  }

  protected _yieldIsForTypes(y: Yield, types: Set<TypeObject>): boolean {
    if (y.for.size === 0) return true;
    if (has(types, (type) => objectIsAnyOfKeys(type, y.for))) return true;

    return false;
  }

  protected _yieldIsVsTypes(y: Yield, types: Set<TypeObject>): boolean {
    return has(types, (type) => y.vs.size === 0 || objectIsAnyOfKeys(type, y.vs));
  }

  getLumpAmount(type: YieldTypeKey): number {
    return roundToTenth(reduce(this._lump.get(type) ?? [], (amount, y) => amount + y.amount, 0));
  }

  getPercentAmount(type: YieldTypeKey): number {
    return roundToTenth(reduce(this._percent.get(type) ?? [], (amount, y) => amount + y.amount, 0));
  }

  getSetAmount(type: YieldTypeKey): number {
    return roundToTenth(reduce(this._set.get(type) ?? [], (amount, y) => amount + y.amount, 0));
  }

  merge(yields: Yields): Yields {
    return new Yields(this._all).add(...yields.all());
  }

  toStorage(allowNegative = true): TypeStorage {
    // Only return lump
    const storage = new TypeStorage();

    Array.from(this._lump.values()).forEach((yields) =>
      yields.forEach((y) => {
        if (y.method!== "lump") return;

        if (allowNegative) {
          storage.add(y.type, y.amount);
        } else {
          storage.add(y.type, Math.max(0, y.amount));
        }
      }),
    );

    return storage;
  }
}

export type YieldTypeKey =
  | "yieldType:airSlot"
  | "yieldType:attack"
  | "yieldType:citizenSlot"
  | "yieldType:culture"
  | "yieldType:damage"
  | "yieldType:defense"
  | "yieldType:designPoints"
  | "yieldType:evasion"
  | "yieldType:faith"
  | "yieldType:food"
  | "yieldType:goalPoints"
  | "yieldType:gold"
  | "yieldType:happiness"
  | "yieldType:heal"
  | "yieldType:health"
  | "yieldType:heritagePoint"
  | "yieldType:heritagePointCost"
  | "yieldType:hitRadius"
  | "yieldType:influence"
  | "yieldType:influenceCost"
  | "yieldType:intercept"
  | "yieldType:missileSlot"
  | "yieldType:moves"
  | "yieldType:moveCost"
  | "yieldType:order"
  | "yieldType:paradropRange"
  | "yieldType:production"
  | "yieldType:productionCost"
  | "yieldType:range"
  | "yieldType:resourceYield"
  | "yieldType:science"
  | "yieldType:scienceCost"
  | "yieldType:sightRadius"
  | "yieldType:span"
  | "yieldType:settleSize"
  | "yieldType:strength"
  | "yieldType:tradeRange"
  | "yieldType:tradeSlot"
  | "yieldType:tradeYield"
  | "yieldType:upkeep";

export const citizenYieldTypeKeys = new Set<YieldTypeKey>([
  "yieldType:culture",
  "yieldType:faith",
  "yieldType:food",
  "yieldType:gold",
  "yieldType:happiness",
  "yieldType:health",
  "yieldType:influence",
  "yieldType:order",
  "yieldType:production",
  "yieldType:science",
]);

export const cityYieldTypeKeys = new Set<YieldTypeKey>([
  "yieldType:airSlot",
  "yieldType:attack",
  "yieldType:culture",
  "yieldType:defense",
  "yieldType:faith",
  "yieldType:food",
  "yieldType:gold",
  "yieldType:happiness",
  "yieldType:heal",
  "yieldType:health",
  "yieldType:hitRadius",
  "yieldType:influence",
  "yieldType:intercept",
  "yieldType:missileSlot",
  "yieldType:moveCost",
  "yieldType:order",
  "yieldType:paradropRange",
  "yieldType:production",
  "yieldType:range",
  "yieldType:resourceYield",
  "yieldType:science",
  "yieldType:sightRadius",
  "yieldType:strength",
  "yieldType:tradeRange",
  "yieldType:tradeSlot",
  "yieldType:tradeYield",
  "yieldType:upkeep",
]);

export const constructionYieldTypeKeys = new Set<YieldTypeKey>([
  "yieldType:airSlot",
  "yieldType:attack",
  "yieldType:citizenSlot",
  "yieldType:culture",
  "yieldType:defense",
  "yieldType:faith",
  "yieldType:food",
  "yieldType:gold",
  "yieldType:happiness",
  "yieldType:heal",
  "yieldType:health",
  "yieldType:hitRadius",
  "yieldType:influence",
  "yieldType:intercept",
  "yieldType:missileSlot",
  "yieldType:moveCost",
  "yieldType:order",
  "yieldType:paradropRange",
  "yieldType:production",
  "yieldType:range",
  "yieldType:resourceYield",
  "yieldType:science",
  "yieldType:sightRadius",
  "yieldType:span",
  "yieldType:strength",
  "yieldType:tradeRange",
  "yieldType:tradeSlot",
  "yieldType:tradeYield",
  "yieldType:upkeep",
]);

export const playerYieldTypeKeys = new Set<YieldTypeKey>([
  "yieldType:culture",
  "yieldType:faith",
  "yieldType:gold",
  "yieldType:happiness",
  "yieldType:influence",
  "yieldType:resourceYield",
  "yieldType:science",
  "yieldType:upkeep",
]);

export const tileYieldTypeKeys = new Set<YieldTypeKey>([
  "yieldType:airSlot",
  "yieldType:citizenSlot",
  "yieldType:culture",
  "yieldType:damage",
  "yieldType:defense",
  "yieldType:evasion",
  "yieldType:faith",
  "yieldType:food",
  "yieldType:gold",
  "yieldType:happiness",
  "yieldType:heal",
  "yieldType:health",
  "yieldType:influence",
  "yieldType:intercept",
  "yieldType:missileSlot",
  "yieldType:moveCost",
  "yieldType:order",
  "yieldType:paradropRange",
  "yieldType:production",
  "yieldType:range",
  "yieldType:resourceYield",
  "yieldType:science",
  "yieldType:sightRadius",
  "yieldType:strength",
  "yieldType:tradeRange",
  "yieldType:tradeSlot",
  "yieldType:tradeYield",
  "yieldType:upkeep",
]);

export const tradeRouteYieldTypeKeys = new Set<YieldTypeKey>([
  "yieldType:culture",
  "yieldType:faith",
  "yieldType:food",
  "yieldType:gold",
  "yieldType:happiness",
  "yieldType:health",
  "yieldType:influence",
  "yieldType:order",
  "yieldType:production",
  "yieldType:resourceYield",
  "yieldType:science",
  "yieldType:tradeYield",
  "yieldType:upkeep",
]);

export const unitYieldTypeKeys = new Set<YieldTypeKey>([
  "yieldType:airSlot",
  "yieldType:attack",
  "yieldType:damage",
  "yieldType:defense",
  "yieldType:evasion",
  "yieldType:heal",
  "yieldType:hitRadius",
  "yieldType:intercept",
  "yieldType:missileSlot",
  "yieldType:moves",
  "yieldType:paradropRange",
  "yieldType:productionCost",
  "yieldType:range",
  "yieldType:resourceYield",
  "yieldType:sightRadius",
  "yieldType:settleSize",
  "yieldType:strength",
  "yieldType:tradeRange",
  "yieldType:upkeep",
]);
