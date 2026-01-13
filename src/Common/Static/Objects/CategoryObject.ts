import {
  CategoryClass,
  CatKey,
  ConceptTypeKey,
  StaticKey,
  TypeKey,
} from "@/Common/Static/StaticEnums";
import { ObjectIcon } from "@/Common/Objects/World";
import { getClassAndConcept, IStaticObject } from "@/Common/Static/Objects/_StaticObject";
import { CompiledCategoryData } from "@/Data/StaticDataCompiler";
import { getObjectIcon } from "@/Common/Static/Icon";

export type CategoryObject = IStaticObject & {
  // Duplicate IStaticObject attributes for clarity
  class: CategoryClass;
  key: CatKey;
  concept: ConceptTypeKey;
  name: string;
  description: string;
  icon: ObjectIcon;

  allows: TypeKey[];
  relatesTo: StaticKey[];
};

export function initCategoryObject(data: CompiledCategoryData): CategoryObject {
  const classAndConcept = getClassAndConcept<CategoryClass>(data.key);

  return {
    ...data,

    // Add/init extra data
    ...classAndConcept,
    icon: getObjectIcon(data.key, classAndConcept.concept),
  };
}
