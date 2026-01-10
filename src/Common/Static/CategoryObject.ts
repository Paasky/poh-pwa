import { CatKey, ObjectIcon, TypeKey } from "@/Common/Objects/Common";
import { CategoryClass, ConceptTypeKey } from "@/Common/Static/StaticEnums";

export interface CategoryObject {
  objType: "CategoryObject";
  class: CategoryClass;
  key: CatKey;
  concept: ConceptTypeKey;
  name: string;
  icon: ObjectIcon;

  relatesTo: TypeKey[];
}
