// Type object definitions (encyclopedia/types dataset)
import { CatKey, initPohObject, ObjKey, PohObject, TypeKey } from "./Common";
import { Yields, YieldTypeKey } from "@/Common/Objects/Yields";
import { Requires } from "@/Common/Objects/Requires";

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

export type CatData = {
  category: CategoryObject;
  types: Set<TypeObject>;
};

export function objectIsAnyOfKeys(
  object: TypeObject | CategoryObject,
  anyOfKeys: Set<ObjKey>,
): boolean {
  for (const key of anyOfKeys) {
    // I'm in any of the objects
    if (object.key === key) return true;

    // My category is in any of the objects
    if ((object as TypeObject).category === key) return true;

    // My concept is in any of the objects
    if (object.concept === key) return true;
  }
  return false;
}

export function initCategoryObject(data: Record<string, unknown>): CategoryObject {
  return initPohObject("CategoryObject", data) as CategoryObject;
}

export function initTypeObject(data: Record<string, unknown>): TypeObject {
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
  obj.requires = new Requires(data.requires as (ObjKey | ObjKey[])[]);

  // Init yields
  obj.yields = new Yields();
  for (const yieldObj of (data.yields as Yield[]) ?? []) {
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
  ] as YieldTypeKey[];
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

export type ConceptTypeKey =
  | "conceptType:action"
  | "conceptType:agenda"
  | "conceptType:building"
  | "conceptType:construction"
  | "conceptType:citizen"
  | "conceptType:city"
  | "conceptType:climate"
  | "conceptType:concept"
  | "conceptType:continent"
  | "conceptType:culture"
  | "conceptType:deal"
  | "conceptType:dogma"
  | "conceptType:domain"
  | "conceptType:elevation"
  | "conceptType:equipment"
  | "conceptType:era"
  | "conceptType:event"
  | "conceptType:feature"
  | "conceptType:flatLand"
  | "conceptType:freshWater"
  | "conceptType:goal"
  | "conceptType:god"
  | "conceptType:government"
  | "conceptType:heritage"
  | "conceptType:improvement"
  | "conceptType:interaction"
  | "conceptType:majorCulture"
  | "conceptType:majorLeader"
  | "conceptType:minorCulture"
  | "conceptType:minorLeader"
  | "conceptType:mountains"
  | "conceptType:myth"
  | "conceptType:nationalWonder"
  | "conceptType:naturalWonder"
  | "conceptType:navigableRiver"
  | "conceptType:ocean"
  | "conceptType:platform"
  | "conceptType:player"
  | "conceptType:policy"
  | "conceptType:region"
  | "conceptType:religion"
  | "conceptType:research"
  | "conceptType:resource"
  | "conceptType:revolution"
  | "conceptType:river"
  | "conceptType:route"
  | "conceptType:special"
  | "conceptType:stockpile"
  | "conceptType:technology"
  | "conceptType:terrain"
  | "conceptType:tile"
  | "conceptType:tradeRoute"
  | "conceptType:trait"
  | "conceptType:turn"
  | "conceptType:turnStart"
  | "conceptType:unit"
  | "conceptType:unitDesign"
  | "conceptType:urban"
  | "conceptType:world"
  | "conceptType:worldWonder"
  | "conceptType:yield";

export type SpecialTypeKey =
  | "specialType:againstYourIncident"
  | "specialType:allCities"
  | "specialType:allCitiesWithRailroad"
  | "specialType:allCitiesWithRiver"
  | "specialType:allInTile"
  | "specialType:canBuildSatellites"
  | "specialType:canCarryStockpile"
  | "specialType:canEnterIce"
  | "specialType:canEnterMountains"
  | "specialType:canEnterOcean"
  | "specialType:canEnterSea"
  | "specialType:canHoldTournaments"
  | "specialType:canLandOnCarrier"
  | "specialType:canLevy"
  | "specialType:canMobilize"
  | "specialType:canMoveAfterAttack"
  | "specialType:canSelectTarget"
  | "specialType:cannotAttackWater"
  | "specialType:cannotBeAttacked"
  | "specialType:cannotBuildUnits"
  | "specialType:cannotBuyBuildings"
  | "specialType:cannotDeclineTrade"
  | "specialType:cannotEnter"
  | "specialType:cannotKillLandUnits"
  | "specialType:cannotTradeNonAllies"
  | "specialType:chooseFreeTechnology"
  | "specialType:damagesAllUnitsInTile"
  | "specialType:damagesBuildings"
  | "specialType:damagesImprovements"
  | "specialType:distanceFromCapital"
  | "specialType:elections"
  | "specialType:forceAutomaticBuildQueue"
  | "specialType:forcedStateReligion"
  | "specialType:ignoreMoveCost"
  | "specialType:invisibleBeforeMove"
  | "specialType:landUnitsCanEnter"
  | "specialType:maxPerCity"
  | "specialType:mustBeInAirbase"
  | "specialType:nextToCoast"
  | "specialType:nextToNavigableRiver"
  | "specialType:noDefenseBonuses"
  | "specialType:noDesertDamage"
  | "specialType:noJungleDamage"
  | "specialType:noSnowDamage"
  | "specialType:noStateReligion"
  | "specialType:onlyOnResource"
  | "specialType:pillageRange"
  | "specialType:shipsCanEnter"
  | "specialType:singleUse"
  | "specialType:startSize"
  | "specialType:stockpiled";
