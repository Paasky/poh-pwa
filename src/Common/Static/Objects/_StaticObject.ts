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
  id: string;
  concept: ConceptTypeKey;
  name: string;
  description: string;
  icon: ObjectIcon;

  allows: TypeKey[];
  relatesTo: StaticKey[];
}

export function getClassAndId<ClassT extends CategoryClass | TypeClass>(
  concept: StaticKey,
): { class: ClassT; id: string } {
  const [cls, id] = concept.split(":");
  return {
    class: cls as ClassT,
    id,
  };
}
