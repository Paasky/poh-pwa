import { Requires } from "@/Common/Static/Objects/Requires";
import { Yields } from "@/Common/Static/Objects/Yields";
import {
  ActionTypeKey,
  ConceptTypeKey,
  SpecialTypeKey,
  StaticKey,
  TypeClass,
  TypeKey,
} from "@/Common/Static/StaticEnums";
import { getObjectIcon, ObjectIcon } from "@/Common/Static/Icon";
import { CompiledTypeData } from "@/Data/StaticDataCompiler";
import { getClass, IStaticObject } from "@/Common/Static/Objects/_StaticObject";

export type TypeObject = IStaticObject & {
  // Duplicate IStaticObject attributes for clarity
  class: TypeClass;
  key: TypeKey;
  concept: ConceptTypeKey;
  name: string;
  description: string;
  icon: ObjectIcon;
  category?: StaticKey;
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
  cities?: string[];

  actions: ActionTypeKey[];
  allows: TypeKey[];
  requires: Requires;
  yields: Yields;
  gains: TypeKey[];
  upgradesTo: TypeKey[];
  upgradesFrom: TypeKey[];
  specials: SpecialTypeKey[];
  relatesTo: StaticKey[];
};

export function initTypeObject(data: CompiledTypeData): TypeObject {
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
    class: getClass<TypeClass>(data.key),
    icon: getObjectIcon(data.key, data.concept, data.category),
    requires: new Requires(data.requires),
    yields,

    allows: data.allows ?? [],
    upgradesTo: data.upgradesTo ?? [],
    upgradesFrom: data.upgradesFrom ?? [],
    actions: data.actions ?? [],
    specials: data.specials ?? [],
    gains: data.gains ?? [],
    relatesTo: data.relatesTo ?? [],

    // Add costs
    heritagePointCost: yields.getLumpAmount("yieldType:heritagePointCost"),
    influenceCost: yields.getLumpAmount("yieldType:influenceCost"),
    moveCost: yields.getLumpAmount("yieldType:moveCost"),
    productionCost: yields.getLumpAmount("yieldType:productionCost"),
    scienceCost: yields.getLumpAmount("yieldType:scienceCost"),
  };
}
