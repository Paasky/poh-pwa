// Type object definitions (encyclopedia/types dataset)
import { initPohObject, ObjKey } from "./Common";
import type { RawCategoryData } from "@/Data/StaticDataLoader";
import { TypeObject } from "@/Common/Static/TypeObject";
import { CategoryObject } from "@/Common/Static/CategoryObject";

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

export function initCategoryObject(data: RawCategoryData): CategoryObject {
  return initPohObject("CategoryObject", {
    relatesTo: [],
    ...(data as unknown as Record<string, unknown>),
  }) as CategoryObject;
}
