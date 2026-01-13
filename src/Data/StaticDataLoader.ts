import { fetchJSON } from "@/Common/Helpers/network";
import type { CatKey, TypeKey } from "@/Common/Objects/World";
import {
  CategoryObject,
  initCategoryObject,
  initTypeObject,
  TypeObject,
} from "@/Common/Objects/TypeObject";

// --- Zod Schemas ---

export async function getStaticData(): Promise<ParsedStaticData> {
  return await fetchJSON<ParsedStaticData>("/data/staticData.json");
}

export function parseAndValidate(rawStaticData: ParsedStaticData): {
  types: Map<TypeKey, TypeObject>;
  categories: Map<CatKey, CategoryObject>;
} {
  const types = new Map<TypeKey, TypeObject>();
  const categories = new Map<CatKey, CategoryObject>();

  const errors = new Map<string, string[]>();

  /**
   * Helper to track missing references and report them later.
   */
  const trackMissing = (sourceKey: string, targetKey: string): boolean => {
    if (!targetKey) return true;
    // Standard check
    if (types.has(targetKey as TypeKey) || categories.has(targetKey as CatKey)) return true;

    // Era as Category exception (Bible 1.3 & 1.11)
    if (targetKey.startsWith("eraType:") && types.has(targetKey as TypeKey)) return true;

    // Report missing
    if (!errors.has(sourceKey)) errors.set(sourceKey, []);
    const errs = errors.get(sourceKey)!;
    if (!errs.includes(targetKey)) errs.push(targetKey);
    return false;
  };

  /**
   * Helper to add to array only if not already present.
   */
  const safeAdd = (array: string[], item: string): void => {
    if (!array.includes(item)) array.push(item);
  };

  // 1. Initial Load
  for (const data of rawStaticData.categories) {
    categories.set(data.key, initCategoryObject(data));
  }
  for (const data of rawStaticData.types) {
    types.set(data.key, initTypeObject(data));
  }

  // 2. Category Pass
  categories.forEach((cat) => {
    trackMissing(cat.key, cat.concept);
    cat.relatesTo.forEach((targetKey) => trackMissing(cat.key, targetKey));
  });

  // 3. Type Pass (Consolidated)
  types.forEach((obj) => {
    // Basic Fields
    trackMissing(obj.key, obj.category as string);
    trackMissing(obj.key, obj.concept);

    // Arrays & RelatesTo Expanded
    const arrayFields: (keyof TypeObject)[] = [
      "actions",
      "allows",
      "gains",
      "upgradesTo",
      "upgradesFrom",
      "specials",
      "relatesTo",
    ];

    arrayFields.forEach((field) => {
      const arr = obj[field] as string[];
      if (!Array.isArray(arr)) return;

      arr.forEach((targetKey) => {
        if (trackMissing(obj.key, targetKey)) {
          // Expanded RelatesTo (actions, gains, specials)
          if (["actions", "gains", "specials"].includes(field)) {
            const target =
              (types.get(targetKey as TypeKey) as TypeObject | CategoryObject) ||
              categories.get(targetKey as CatKey);
            if (target) safeAdd(target.relatesTo, obj.key);
          }
        }
      });
    });

    // Inverse Requires
    obj.requires.allTypes.forEach((reqKey) => {
      if (trackMissing(obj.key, reqKey)) {
        const target = types.get(reqKey as TypeKey);
        if (target) safeAdd(target.allows, obj.key);
      }
    });

    // Inverse Upgrades
    obj.upgradesTo.forEach((targetKey) => {
      if (trackMissing(obj.key, targetKey)) {
        const target = types.get(targetKey as TypeKey);
        if (target) safeAdd(target.upgradesFrom, obj.key);
      }
    });

    // Category Back-Relation
    if (obj.category && trackMissing(obj.key, obj.category)) {
      const cat = categories.get(obj.category);
      if (cat) safeAdd(cat.relatesTo, obj.key);
    }

    // Yields
    obj.yields.all().forEach((y) => {
      trackMissing(obj.key, y.type);
      y.for.forEach((targetKey) => {
        if (trackMissing(obj.key, targetKey)) {
          const target =
            (types.get(targetKey as TypeKey) as TypeObject | CategoryObject) ||
            categories.get(targetKey as CatKey);
          if (target) safeAdd(target.relatesTo, obj.key);
        }
      });
      y.vs.forEach((targetKey) => {
        if (trackMissing(obj.key, targetKey)) {
          const target =
            (types.get(targetKey as TypeKey) as TypeObject | CategoryObject) ||
            categories.get(targetKey as CatKey);
          if (target) safeAdd(target.relatesTo, obj.key);
        }
      });
    });
  });

  // 4. Consolidated Throw (Bible 1.11)
  if (errors.size > 0) {
    const messages: string[] = [];
    errors.forEach((missingKeys, sourceKey) => {
      messages.push(`Object "${sourceKey}" refers to missing keys: [${missingKeys.join(", ")}]`);
    });
    throw new Error(messages.join("\n"));
  }

  return { types, categories };
}

async function fetchFiles<T>(files: string[], section: "types" | "categories"): Promise<T[]> {
  const results = await Promise.all(
    files.map(async (file) => {
      const data = await fetchJSON<unknown>(`/data/${section}/${file}`);
      const items = (Array.isArray(data) ? data : [data]) as T[];

      // Validation
      items.forEach((item) => {
        // Basic validation with zod
        if (section === "types") {
          TypeObjectSchema.parse(item);
        } else {
          CategoryObjectSchema.parse(item);
        }

        // Key consistency check
        // e.g., actionType:move must be in a file starting with actionType
        const [expectedPrefix] = file.split("/").pop()!.split(".");
        const [actualPrefix] = (item as RawTypeData | RawCategoryData).key.split(":");

        if (actualPrefix !== expectedPrefix) {
          throw new Error(
            `Key consistency error: item ${
              (item as RawTypeData | RawCategoryData).key
            } found in file ${file} (expected prefix ${expectedPrefix})`,
          );
        }
      });

      return items;
    }),
  );

  return results.flat();
}
