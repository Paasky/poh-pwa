import { getClassAndConcept, ObjectIcon } from "@/Common/Objects/Common";
import { Requires } from "@/Common/Static/Requires";
import { Yields } from "@/Common/Static/Yields";
import { ConceptTypeKey, StaticKey, TypeClass, TypeKey } from "@/Common/Static/StaticEnums";
import { CompiledTypeData } from "../../../scripts/deployment/StaticDataCompiler";
import { getObjectIcon } from "@/Common/types/icons";

export interface TypeObject {
  objType: "TypeObject";
  class: TypeClass;
  key: TypeKey;
  concept: ConceptTypeKey;
  name: string;
  icon: ObjectIcon;
  category?: StaticKey;
  description?: string;
  audio?: string[];
  image?: string;
  quote?: {
    greeting?: string;
    text?: string;
    source?: string;
    url?: string;
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

  actions: TypeKey[];
  allows: TypeKey[];
  requires: Requires;
  yields: Yields;
  gains: TypeKey[];
  upgradesTo: TypeKey[];
  upgradesFrom: TypeKey[];
  specials: TypeKey[];
  relatesTo: TypeKey[];
}

export function initTypeObject(data: CompiledTypeData): TypeObject {
  const classAndConcept = getClassAndConcept(data.key);

  const yields = new Yields(
    (data.yields ?? []).map((compiledYield) => ({
      type: compiledYield.type,
      method: compiledYield.method ?? "lump",
      amount: compiledYield.amount ?? 0,
      for: new Set(compiledYield.for ?? []),
      vs: new Set(compiledYield.vs ?? []),
    })),
  );

  return {
    ...data,

    // Add/init extra data
    objType: "TypeObject",
    ...classAndConcept,
    icon: getObjectIcon(data.key, classAndConcept.concept, data.category),
    requires: new Requires(data.requires),
    yields,

    // Add costs
    heritagePointCost: yields.getLumpAmount("yieldType:heritagePointCost"),
    influenceCost: yields.getLumpAmount("yieldType:influenceCost"),
    moveCost: yields.getLumpAmount("yieldType:moveCost"),
    productionCost: yields.getLumpAmount("yieldType:productionCost"),
    scienceCost: yields.getLumpAmount("yieldType:scienceCost"),
  };
}
