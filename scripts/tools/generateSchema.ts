import fs from "fs";
import path from "path";
import { toJSONSchema, z } from "zod";

// We need to import the schemas.
import { CategoryObjectSchema, TypeObjectSchema } from "../../src/Data/StaticDataLoader.ts";

const schema = z.object({
  types: z.array(TypeObjectSchema),
  categories: z.array(CategoryObjectSchema),
});

const jsonSchema = toJSONSchema(schema);

const outputPath = path.join(process.cwd(), "public", "data", "schema.json");
fs.writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2), "utf8");
console.log(`✓ Schema saved to ${path.relative(process.cwd(), outputPath)}`);
