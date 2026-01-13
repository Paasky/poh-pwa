import {
  CategoryClass,
  ConceptTypeKey,
  StaticKey,
  TypeClass,
  TypeKey,
} from "@/Common/Static/StaticEnums";
import { ObjectIcon } from "@/Common/Objects/World";

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

export function getClassAndConcept<ClassT extends CategoryClass | TypeClass>(
  key: StaticKey,
): {
  class: ClassT;
  concept: ConceptTypeKey;
} {
  const className = key.split(":")[0] as ClassT;
  if (className.endsWith("Category")) {
    return {
      class: className,
      concept: `conceptType:${className.substring(0, key.length - 8)}` as ConceptTypeKey,
    };
  }
  if (className.endsWith("Type")) {
    return {
      class: className,
      concept: `conceptType:${className.substring(0, key.length - 4)}` as ConceptTypeKey,
    };
  }

  throw new Error(
    `Invalid key "${key}": must be format {class}:{id} and class must end in Category or Type`,
  );
}
