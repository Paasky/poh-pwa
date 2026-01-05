import { z } from "zod";
import { fetchJSON } from "@/helpers/network";
import type { CatKey, ObjKey, TypeKey } from "@/Common/Objects/Common";
import type { ConceptTypeKey, SpecialTypeKey } from "@/Common/Objects/TypeObject";
import type { YieldTypeKey } from "@/Common/Objects/Yields";

// --- Zod Schemas ---

export const YieldSchema = z.object({
  type: z.string() as z.ZodType<YieldTypeKey>,
  method: z.enum(["lump", "percent", "set"]).optional().default("lump"),
  amount: z.number().optional().default(0),
  for: z
    .array(z.string() as z.ZodType<ObjKey>)
    .optional()
    .default([]),
  vs: z
    .array(z.string() as z.ZodType<ObjKey>)
    .optional()
    .default([]),
});

export const RequiresSchema = z
  .array(z.union([z.string() as z.ZodType<ObjKey>, z.array(z.string() as z.ZodType<ObjKey>)]))
  .optional()
  .default([]);

export const TypeObjectSchema = z.object({
  key: z.string() as z.ZodType<TypeKey>,
  name: z.string(),
  concept: z.string() as z.ZodType<ConceptTypeKey>,
  category: (z.string() as z.ZodType<CatKey>).optional(),
  description: z.string().optional(),
  audio: z.array(z.string()).optional(),
  image: z.string().optional(),
  quote: z
    .object({
      greeting: z.string(),
      text: z.string(),
      source: z.string(),
      url: z.string(),
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
  inheritYieldTypes: z.array(z.string() as z.ZodType<TypeKey>).optional(),
  preferredClimates: z.array(z.string() as z.ZodType<TypeKey>).optional(),
  allows: z
    .array(z.string() as z.ZodType<TypeKey>)
    .optional()
    .default([]),
  requires: RequiresSchema,
  yields: z.array(YieldSchema).optional().default([]),
  gains: z
    .array(z.string() as z.ZodType<TypeKey>)
    .optional()
    .default([]),
  upgradesTo: z
    .array(z.string() as z.ZodType<TypeKey>)
    .optional()
    .default([]),
  upgradesFrom: z
    .array(z.string() as z.ZodType<TypeKey>)
    .optional()
    .default([]),
  specials: z
    .array(z.string() as z.ZodType<SpecialTypeKey>)
    .optional()
    .default([]),
  relatesTo: z
    .array(z.string() as z.ZodType<TypeKey>)
    .optional()
    .default([]),
});

export const CategoryObjectSchema = z.object({
  key: z.string() as z.ZodType<CatKey>,
  name: z.string(),
  concept: z.string() as z.ZodType<ConceptTypeKey>,
  relatesTo: z
    .array(z.string() as z.ZodType<TypeKey>)
    .optional()
    .default([]),
});

export type TypeObjectData = z.infer<typeof TypeObjectSchema>;
export type CategoryObjectData = z.infer<typeof CategoryObjectSchema>;

export interface RawStaticData {
  types: TypeObjectData[];
  categories: CategoryObjectData[];
}

interface Manifest {
  types: string[];
  categories: string[];
}

export async function getStaticData(): Promise<RawStaticData> {
  const manifest = await fetchJSON<Manifest>("/data/manifest.json");

  const [types, categories] = await Promise.all([
    fetchFiles<TypeObjectData>(manifest.types, "types"),
    fetchFiles<CategoryObjectData>(manifest.categories, "categories"),
  ]);

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
        const [actualPrefix] = (item as TypeObjectData | CategoryObjectData).key.split(":");

        if (actualPrefix !== expectedPrefix) {
          throw new Error(
            `Key consistency error: item ${
              (item as TypeObjectData | CategoryObjectData).key
            } found in file ${file} (expected prefix ${expectedPrefix})`,
          );
        }
      });

      return items;
    }),
  );

  return results.flat();
}
