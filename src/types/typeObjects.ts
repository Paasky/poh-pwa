// Type object definitions (encyclopedia/types dataset)
import { CatKey, initPohObject, PohObject, TypeKey } from "./common";
import { Yield, Yields } from "@/objects/yield";
import { Requires } from "@/objects/Requires";

export type TypeClass =
  | "actionType"
  | "buildingType"
  | "climateType"
  | "conceptType"
  | "continentType"
  | "dogmaType"
  | "domainType"
  | "elevationType"
  | "equipmentType"
  | "eraType"
  | "eventType"
  | "featureType"
  | "goalType"
  | "godType"
  | "heritageType"
  | "improvementType"
  | "majorCultureType"
  | "majorLeaderType"
  | "minorCultureType"
  | "minorLeaderType"
  | "mythType"
  | "nationalWonderType"
  | "naturalWonderType"
  | "oceanType"
  | "platformType"
  | "policyType"
  | "regionType"
  | "resourceType"
  | "routeType"
  | "specialType"
  | "stockpileType"
  | "technologyType"
  | "terrainType"
  | "traitType"
  | "worldWonderType"
  | "yieldType";

export type CategoryClass =
  | "buildingCategory"
  | "equipmentCategory"
  | "goalCategory"
  | "godCategory"
  | "heritageCategory"
  | "improvementCategory"
  | "majorCultureCategory"
  | "majorLeaderCategory"
  | "minorCultureCategory"
  | "minorLeaderCategory"
  | "mythCategory"
  | "nationalWonderCategory"
  | "naturalWonderCategory"
  | "platformCategory"
  | "policyCategory"
  | "regionCategory"
  | "resourceCategory"
  | "stockpileCategory"
  | "technologyCategory"
  | "traitCategory"
  | "worldWonderCategory";

export interface CategoryObject extends PohObject {
  objType: "CategoryObject";
  class: CategoryClass;
  key: CatKey;
  relatesTo: TypeKey[];
}

export interface TypeObject extends PohObject {
  objType: "TypeObject";
  class: TypeClass;
  key: TypeKey;
  category?: `${CategoryClass}:${string}`;
  description?: string;
  audio?: string[];
  image?: string;
  quote?: {
    greeting: string;
    text: string;
    source: string;
    url: string;
  };
  intro?: string;
  p1?: string;
  p2?: string;
  x?: number;
  y?: number;
  hotkey?: string;
  moves?: number;
  heritagePointCost?: number;
  influenceCost?: number;
  moveCost?: number;
  productionCost?: number;
  scienceCost?: number;
  isPositive?: boolean;
  names?: Record<string, string>; // uses platform.name as the key
  inheritYieldTypes?: TypeKey[];
  preferredClimates?: TypeKey[];

  allows: TypeKey[];
  requires: Requires;
  yields: Yields;
  gains: TypeKey[];
  upgradesTo: TypeKey[];
  upgradesFrom: TypeKey[];
  specials: TypeKey[];
  relatesTo: TypeKey[];
}

// eslint-disable-next-line
export function initCategoryObject(data: any): CategoryObject {
  return initPohObject("CategoryObject", data) as CategoryObject;
}

// eslint-disable-next-line
export function initTypeObject(data: any): TypeObject {
  const obj = initPohObject("TypeObject", {
    allows: [],
    gains: [],
    upgradesFrom: [],
    upgradesTo: [],
    specials: [],
    relatesTo: [],
    ...data,
  }) as TypeObject;

  // Init requires
  obj.requires = new Requires(data.requires);

  // Init yields
  obj.yields = new Yields();
  for (const yieldObj of data.yields ?? []) {
    obj.yields.add({
      type: yieldObj.type,
      method: yieldObj.method ?? "lump",
      amount: yieldObj.amount ?? 0,
      for: yieldObj.for ?? [],
      vs: yieldObj.vs ?? [],
    } as Yield);
  }

  // Add cost yields
  const costYieldTypes = [
    "yieldType:heritagePointCost",
    "yieldType:influenceCost",
    "yieldType:moveCost",
    "yieldType:productionCost",
    "yieldType:scienceCost",
  ] as TypeKey[];
  for (const type of costYieldTypes) {
    const amount = obj.yields.getLumpAmount(type);
    if (amount > 0) {
      obj[
        type.replace("yieldType:", "") as
          | "heritagePointCost"
          | "influenceCost"
          | "moveCost"
          | "productionCost"
          | "scienceCost"
      ] = amount;
    }
  }

  return obj;
}
