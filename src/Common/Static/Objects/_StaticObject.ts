import {
  CategoryClass,
  ConceptTypeKey,
  StaticKey,
  TypeClass,
  TypeKey,
} from "@/Common/Static/StaticEnums";
import { ObjectIcon } from "@/Common/Static/Icon";

export interface IStaticObject {
  class: CategoryClass | TypeClass;
  key: StaticKey;
  concept: ConceptTypeKey;
  name: string;
  description: string;
  icon: ObjectIcon;

  allows: TypeKey[];
  relatesTo: StaticKey[];
}

export function getClass<ClassT extends CategoryClass | TypeClass>(concept: StaticKey): ClassT {
  return concept.split(":")[0] as ClassT;
}
