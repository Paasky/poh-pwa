import {
  CategoryClass,
  CatKey,
  ConceptTypeKey,
  StaticKey,
  TypeKey,
} from "@/Common/Static/StaticEnums";
import { getClassAndId, IStaticObject } from "@/Common/Static/Objects/_StaticObject";
import { CompiledCategoryData } from "@/Data/StaticDataCompiler";
import { getObjectIcon, ObjectIcon } from "@/Common/Static/Icon";

export type CategoryObject = IStaticObject & {
  // Duplicate IStaticObject attributes for clarity
  class: CategoryClass;
  id: string;
  key: CatKey;
  concept: ConceptTypeKey;
  name: string;
  description: string;
  icon: ObjectIcon;

  allows: TypeKey[];
  relatesTo: StaticKey[];
};

export function initCategoryObject(data: CompiledCategoryData): CategoryObject {
  return {
    ...data,

    // Add/init extra data
    ...getClassAndId<CategoryClass>(data.key),
    icon: getObjectIcon(data.key, data.concept),
    allows: data.allows ?? [],
    relatesTo: data.relatesTo ?? [],
  };
}
