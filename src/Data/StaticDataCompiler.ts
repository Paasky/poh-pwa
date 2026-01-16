/* eslint-disable no-console */

import fs from "fs";
import path from "path";
import { CatKey, StaticKey, TypeKey } from "@/Common/Static/StaticEnums";
import { CategoryObjectSchema, RawCategoryData, RawTypeData, TypeObjectSchema, } from "@/Common/Validation";

export type CompiledCategoryData = RawCategoryData & {
  allows: TypeKey[];
  relatesTo: TypeKey[];
};
export type CompiledTypeData = RawTypeData & {
  allows: TypeKey[];
  relatesTo: StaticKey[];
  upgradesTo: TypeKey[];
};

export interface CompiledStaticData {
  types: CompiledTypeData[];
  categories: CompiledCategoryData[];
}

export class StaticDataCompiler {
  private allErrors: string[] = [];
  private typeRegistry = new Map<TypeKey, CompiledTypeData>();
  private categoryRegistry = new Map<CatKey, CompiledCategoryData>();

  private sourceDir: string;
  private outputDir: string;

  constructor(sourceDir?: string, outputDir?: string) {
    this.sourceDir = sourceDir || path.join(process.cwd(), "data");
    this.outputDir = outputDir || path.join(process.cwd(), "public", "data");
  }

  public compile() {
    console.log("Starting Static Data Compiler...");
    this.allErrors = [];
    this.typeRegistry.clear();
    this.categoryRegistry.clear();

    // 1. Discovery & Ingestion
    this.ingest();

    // 2. Relational Baking
    this.process();

    // 3. Report & Emit
    if (this.allErrors.length > 0) {
      console.error("x Static Data Validation Failed:");
      console.error(this.allErrors.join("\n"));
      throw new Error(`Static Data Compiler failed with ${this.allErrors.length} errors.`);
    }

    this.emit();
    this.analyze();
    console.log("✓ Static Data Compiler complete.");
  }

  private ingest() {
    const categoriesDir = path.join(this.sourceDir, "categories");
    if (fs.existsSync(categoriesDir)) {
      this.ingestFiles(categoriesDir, "category");
    } else {
      console.warn(`> Skipping categories: ${categoriesDir} does not exist.`);
    }

    const typesDir = path.join(this.sourceDir, "types");
    if (fs.existsSync(typesDir)) {
      this.ingestFiles(typesDir, "type");
    } else {
      console.warn(`> Skipping types: ${typesDir} does not exist.`);
    }
  }

  private ingestFiles(dir: string, objectType: "category" | "type"): void {
    if (!fs.existsSync(dir)) return;
    const schema = objectType === "category" ? CategoryObjectSchema : TypeObjectSchema;
    const registry = objectType === "category" ? this.categoryRegistry : this.typeRegistry;

    const files = this.getJsonFiles(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);

      try {
        const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (!Array.isArray(content)) {
          this.allErrors.push(`[JSON Error] ${filePath} is not an array.`);
          continue;
        }

        const items = content as RawTypeData[];

        for (const item of items) {
          // Validation
          const result = schema.safeParse(item);
          if (!result.success) {
            result.error.issues.forEach((err) => {
              this.allErrors.push(
                `[Validation Error] ${filePath} | ${item.key} | ${err.path.join(".")}: ${err.message}`,
              );
            });
            continue;
          }

          // Type assertion for registry key
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const key = item.key as any;

          // Check against duplicates
          if (registry.has(key)) {
            this.allErrors.push(`[Duplicate Error] Duplicate key "${key}" in "${filePath}".`);
            continue;
          }

          // Validated data is added to the registry
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          registry.set(key, result.data as any);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        this.allErrors.push(`[JSON Error] Failed to parse ${filePath}: ${e.message}`);
      }
    }
  }

  private getJsonFiles(dir: string): string[] {
    const results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results.push(...this.getJsonFiles(filePath).map((f) => path.join(file, f)));
      } else if (file.endsWith(".json") && file !== "schema.json") {
        results.push(file);
      }
    }
    return results;
  }

  private process() {
    // Process Categories (Check Referenced Keys)
    this.categoryRegistry.forEach((cat) => {
      // Make sure referenced keys actually exist
      this.trackMissing(cat.key, cat.concept);
    });

    // Process Types (Check Referenced Keys + Build Back-Relations)
    this.typeRegistry.forEach((obj) => {
      // Make sure referenced keys actually exist
      this.trackMissing(obj.key, obj.concept);
      if (obj.category) this.trackMissing(obj.key, obj.category);

      // Back-Relation: requires -> allows
      const allRequires = obj.requires.flat() as StaticKey[];
      allRequires.forEach((reqKey) => {
        this.trackMissing(obj.key, reqKey);
        const target =
          this.typeRegistry.get(reqKey as TypeKey) ?? this.categoryRegistry.get(reqKey as CatKey);
        if (target) {
          target.allows = this.safeAdd(target.allows, obj.key);
        }
      });

      // Back-Relation: upgradesFrom -> upgradesTo
      obj.upgradesFrom.forEach((targetKey) => {
        this.trackMissing(obj.key, targetKey);
        const target = this.typeRegistry.get(targetKey);
        if (target) {
          target.upgradesTo = this.safeAdd(target.upgradesTo, obj.key);
        }
      });

      // Back-Relation: category -> relatesTo
      if (obj.category) {
        const cat =
          this.typeRegistry.get(obj.category as TypeKey) ||
          this.categoryRegistry.get(obj.category as CatKey);
        if (cat) {
          cat.relatesTo = this.safeAdd(cat.relatesTo, obj.key);
        }
      }

      // Back-Relation: actions, gains, specials -> relatesTo
      ["actions", "gains", "specials"].forEach((field) => {
        // @bible-check 1.5: Dynamic field access for relation baking.
        const keys = obj[field as keyof CompiledTypeData] as TypeKey[];
        keys.forEach((targetKey) => {
          this.trackMissing(obj.key, targetKey);
          const target = this.typeRegistry.get(targetKey);
          if (target) {
            target.relatesTo = this.safeAdd(target.relatesTo, obj.key);
          }
        });
      });

      // Back-Relation: yields > for/vs -> relatesTo
      obj.yields.forEach((y) => {
        this.trackMissing(obj.key, y.type);
        [...(y.for || []), ...(y.vs || [])].forEach((targetKey: StaticKey) => {
          this.trackMissing(obj.key, targetKey);
          const target =
            this.typeRegistry.get(targetKey as TypeKey) ||
            this.categoryRegistry.get(targetKey as CatKey);
          if (target) {
            target.relatesTo = this.safeAdd(target.relatesTo, obj.key);
          }
        });
      });
    });
  }

  private emit() {
    const data: CompiledStaticData = {
      types: Array.from(this.typeRegistry.values()).sort((a, b) => a.key.localeCompare(b.key)),
      categories: Array.from(this.categoryRegistry.values()).sort((a, b) =>
        a.key.localeCompare(b.key),
      ),
    };

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    fs.writeFileSync(path.join(this.outputDir, "staticData.json"), JSON.stringify(data, null, 2));
    console.log(
      `✓ Compiled staticData.json (${data.types.length} types, ${data.categories.length} categories)`,
    );
  }

  private analyze() {
    // Analysis helper for development
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const analysis: any = { types: {}, categories: {} };

    this.typeRegistry.forEach((item) => {
      const [className] = item.key.split(":");
      analysis.types[className] ??= {};
      Object.keys(item).forEach((k) => {
        analysis.types[className][k] = (analysis.types[className][k] || 0) + 1;
      });
    });

    this.categoryRegistry.forEach((item) => {
      const [className] = item.key.split(":");
      analysis.categories[className] ??= {};
      Object.keys(item).forEach((k) => {
        analysis.categories[className][k] = (analysis.categories[className][k] || 0) + 1;
      });
    });

    fs.writeFileSync(
      path.join(this.outputDir, "staticAnalysis.json"),
      JSON.stringify(analysis, null, 2), // TODO: Minify for production
    );
    console.log("✓ Analysis staticAnalysis.json generated");
  }
  private safeAdd<T>(array: T[] | undefined, item: T): T[] {
    const arr = array || [];
    if (!arr.includes(item)) arr.push(item);
    return arr;
  }

  private trackMissing(sourceKey: StaticKey, targetKey: StaticKey) {
    if (
      !this.typeRegistry.has(targetKey as TypeKey) &&
      !this.categoryRegistry.has(targetKey as CatKey)
    ) {
      this.allErrors.push(`[Reference Error] "${sourceKey}" refers to missing key "${targetKey}"`);
    }
  }
}

// Execute if run directly
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("StaticDataCompiler.ts") ||
    process.argv[1].endsWith("StaticDataCompiler.js") ||
    process.argv[1].includes("tsx"));

if (isMain) {
  try {
    new StaticDataCompiler().compile();
  } catch {
    process.exit(1);
  }
}
