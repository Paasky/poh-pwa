import z from "zod";
import {
  ActionTypeKey,
  CatKey,
  ConceptTypeKey,
  SpecialTypeKey,
  StaticKey,
  TypeKey,
} from "@/Common/Static/StaticEnums";
import { YieldTypeKey } from "@/Common/Static/Objects/Yields";

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
  key: z
    .string()
    .refine(
      (k) => {
        const className = k.split(":")[0] ?? "";
        return className.endsWith("Category");
      },
      {
        message: `key prefix must end with "Category" (e.g. "buildingCategory:id")`,
      },
    )
    .transform((v) => v as CatKey),
  name: z.string(),
  concept: z.string().transform((v) => v as ConceptTypeKey),
  description: z.string().default(""),
});

export const TypeObjectSchema = z.object({
  key: z
    .string()
    .refine(
      (k) => {
        const className = k.split(":")[0] ?? "";
        return className.endsWith("Type");
      },
      {
        message: `key prefix must end with "Type" (e.g. "buildingType:id")`,
      },
    )
    .transform((v) => v as TypeKey),
  name: z.string(),
  concept: z.string().transform((v) => v as ConceptTypeKey),
  category: z
    .string()
    .transform((v) => v as StaticKey)
    .optional(),
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
