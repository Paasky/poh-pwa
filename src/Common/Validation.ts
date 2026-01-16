import z from "zod";
import { CategoryClass, CatKey, StaticKey, TypeClass, TypeKey } from "./Static/StaticEnums";
import { GameClass, GameKey } from "@/Common/Models/_GameTypes";

function baseKeySchema<T extends string>(options?: { classes?: string[]; suffix?: string }) {
  return z
    .string()
    .refine((value) => {
      const classAndId = value.split(":");
      if (classAndId.length !== 2 || !classAndId[0] || !classAndId[1]) return false;
      if (options?.classes) return options.classes.includes(classAndId[0]);
      if (options?.suffix) return classAndId[0].endsWith(options.suffix);
      return true;
    })
    .transform((v) => v as T);
}

export function catKeySchema(classes?: CategoryClass[]) {
  return baseKeySchema<CatKey>({ classes, suffix: "Category" });
}
export function gameKeySchema(classes?: GameClass[]) {
  return baseKeySchema<GameKey>({ classes });
}

export function staticKeySchema() {
  return baseKeySchema<StaticKey>();
}

export function typeKeySchema(classes?: TypeClass[]) {
  return baseKeySchema<TypeKey>({ classes, suffix: "Type" });
}

export const RequiresSchema = z
  .array(z.union([staticKeySchema(), z.array(staticKeySchema())]))
  .optional()
  .default([]);

export const YieldSchema = z.object({
  type: typeKeySchema(["yieldType"]),
  method: z.enum(["lump", "percent", "set"]).optional().default("lump"),
  amount: z.number().optional().default(0),
  for: z.array(staticKeySchema()).optional().default([]),
  vs: z.array(staticKeySchema()).optional().default([]),
});

export const CategoryObjectSchema = z.object({
  key: catKeySchema(),
  name: z.string(),
  concept: typeKeySchema(["conceptType"]),
  description: z.string().default(""),
});

export const TypeObjectSchema = z.object({
  key: typeKeySchema(),
  name: z.string(),
  concept: typeKeySchema(["conceptType"]),
  category: catKeySchema().optional(),
  description: z.string().default(""),
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
  cities: z.array(z.string()).optional(),
  requires: RequiresSchema,
  yields: z.array(YieldSchema).optional().default([]),
  gains: z.array(typeKeySchema()).optional().default([]),
  upgradesFrom: z.array(typeKeySchema()).optional().default([]),
  specials: z
    .array(typeKeySchema(["specialType"]))
    .optional()
    .default([]),
  actions: z
    .array(typeKeySchema(["actionType"]))
    .optional()
    .default([]),
});

export type RawTypeData = z.infer<typeof TypeObjectSchema>;
export type RawCategoryData = z.infer<typeof CategoryObjectSchema>;

export const GameObjectSchema = z.object({
  key: gameKeySchema(),
  concept: typeKeySchema(["conceptType"]),
});
