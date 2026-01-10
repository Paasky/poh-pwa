import { z } from "zod";
import { fetchJSON } from "@/Common/Helpers/network";
import type { CatKey, StaticKey, TypeKey } from "@/Common/Objects/Common";
import {
  ActionTypeKey,
  CategoryObject,
  ConceptTypeKey,
  initCategoryObject,
  initTypeObject,
  SpecialTypeKey,
  TypeObject,
} from "@/Common/Objects/TypeObject";
import type { YieldTypeKey } from "@/Common/Static/Yields";

// --- Zod Schemas ---

export const RequiresSchema = z
  .array(
    z.union([
      z.string().transform((v) => v as StaticKey),
      z.array(z.string().transform((v) => v as StaticKey)),
    ]),
  )
  .optional()
  .default([]);

export const YieldSchema = z.object({
  type: z.string().transform((v) => v as YieldTypeKey),
  method: z.enum(["lump", "percent", "set"]).optional().default("lump"),
  amount: z.number().optional().default(0),
  for: z
    .array(z.string().transform((v) => v as StaticKey))
    .optional()
    .default([]),
  vs: z
    .array(z.string().transform((v) => v as StaticKey))
    .optional()
    .default([]),
});

export const CategoryObjectSchema = z.object({
  key: z.string().transform((v) => v as CatKey),
  name: z.string(),
  concept: z.string().transform((v) => v as ConceptTypeKey),
  description: z.string().optional(),
});

export const TypeObjectSchema = z.object({
  key: z.string().transform((v) => v as TypeKey),
  name: z.string(),
  concept: z.string().transform((v) => v as ConceptTypeKey),
  category: z
    .string()
    .transform((v) => v as StaticKey)
    .optional(),
  description: z.string().optional(),
  audio: z.array(z.string()).optional(),
  image: z.string().optional(),
  quote: z
    .object({
      greeting: z.string().optional(),
      text: z.string().optional(),
      source: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
  intro: z.string().optional(),
  p1: z.string().optional(),
  p2: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  hotkey: z.string().optional(),
  moves: z.number().optional(),
  heritagePointCost: z.number().optional(),
  influenceCost: z.number().optional(),
  moveCost: z.number().optional(),
  productionCost: z.number().optional(),
  scienceCost: z.number().optional(),
  isPositive: z.boolean().optional(),
  names: z.object({}).catchall(z.string()).optional(), // Zod 4.3.5 toJSONSchema bug with record()
  requires: RequiresSchema,
  yields: z.array(YieldSchema).optional().default([]),
  gains: z
    .array(z.string().transform((v) => v as TypeKey))
    .optional()
    .default([]),
  upgradesFrom: z
    .array(z.string().transform((v) => v as TypeKey))
    .optional()
    .default([]),
  specials: z
    .array(z.string().transform((v) => v as SpecialTypeKey))
    .optional()
    .default([]),
  actions: z
    .array(z.string().transform((v) => v as ActionTypeKey))
    .optional()
    .default([]),
});

export type RawTypeData = z.infer<typeof TypeObjectSchema>;
export type RawCategoryData = z.infer<typeof CategoryObjectSchema>;

export interface ParsedStaticData {
  types: RawTypeData[];
  categories: RawCategoryData[];
}

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
