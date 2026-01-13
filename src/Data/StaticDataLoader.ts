import { fetchJSON } from "@/Common/Helpers/network";
import { CompiledStaticData } from "@/Data/StaticDataCompiler";
import { initTypeObject, TypeObject } from "@/Common/Static/Objects/TypeObject";
import { StaticKey, TypeKey } from "@/Common/Static/StaticEnums";
import { CategoryObject, initCategoryObject } from "@/Common/Static/Objects/CategoryObject";

// --- Zod Schemas ---

export async function getStaticData(): Promise<CompiledStaticData> {
  return await fetchJSON<CompiledStaticData>("/data/staticData.json");
}

export function load(compiledStaticData: CompiledStaticData): {
  types: Map<TypeKey, TypeObject>;
  categories: Map<StaticKey, CategoryObject>;
} {
  const types = new Map<TypeKey, TypeObject>();
  const categories = new Map<StaticKey, CategoryObject>();

  const errors: string[] = [];

  // Initialize Categories & Types
  for (const data of compiledStaticData.categories) {
    try {
      categories.set(data.key, initCategoryObject(data));
    } catch (e) {
      errors.push(`[${data.key}]: ${e}`);
    }
  }
  for (const data of compiledStaticData.types) {
    try {
      types.set(data.key, initTypeObject(data));
    } catch (e) {
      errors.push(`[${data.key}]: ${e}`);
    }
  }

  if (errors.length > 0) throw new Error(errors.join("\n"));

  return { types, categories };
}
