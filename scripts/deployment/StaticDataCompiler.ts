import fs from "fs";
import path from "path";
import { CategoryObjectSchema, RawCategoryData, RawTypeData, TypeObjectSchema, } from "@/Data/StaticDataLoader";
import { CatKey, StaticKey, TypeKey } from "@/Common/Static/StaticEnums";

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

  private sourceDir = path.join(process.cwd(), "data");
  private outputDir = path.join(process.cwd(), "public", "data");

  public async compile() {
    console.log("⚒ Starting Static Data Compiler...");
    this.allErrors = [];
    this.typeRegistry.clear();
    this.categoryRegistry.clear();

    // 1. Discovery & Ingestion
    await this.ingest();

    // 2. Relational Baking
    if (this.allErrors.length === 0) {
      this.bake();
    }

    // 3. Report & Emit
    if (this.allErrors.length > 0) {
      console.warn("\n❌ Static Data Validation Failed:");
      console.warn(this.allErrors.join("\n"));
      throw new Error(`Static Data Compiler failed with ${this.allErrors.length} errors.`);
    }

    this.emit();
    this.analyze();
    console.log("✓ Static Static Data Compiler complete.");
  }

  private async ingest() {
    const categoriesDir = path.join(this.sourceDir, "categories");
    if (fs.existsSync(categoriesDir)) {
      this.ingestCategoryFiles(categoriesDir);
    } else {
      console.log(`x Skipping categories: ${categoriesDir} does not exist.`);
    }

    const typesDir = path.join(this.sourceDir, "types");
    if (fs.existsSync(typesDir)) {
      this.ingestTypeFiles(typesDir);
    } else {
      console.log(`x Skipping types: ${typesDir} does not exist.`);
    }
  }

  private ingestCategoryFiles(dir: string): void {
    if (!fs.existsSync(dir)) return;

    const files = this.getJsonFiles(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);

      try {
        const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (!Array.isArray(content)) {
          this.allErrors.push(`[JSON Error] ${filePath} is not an array.`);
          continue;
        }

        const items = content as RawCategoryData[];

        for (const [i, item] of items.entries()) {
          // Quick class check from key
          const className = item.key?.split(":")[0];
          if (!className.endsWith("Category")) {
            const key = item.key || `[${i}]`;
            this.allErrors.push(
              `[Prefix Error] Item "${key}" in "${filePath}" does not end with "Category".`,
            );
            continue;
          }

          // Validation
          const result = CategoryObjectSchema.safeParse(item);
          if (!result.success) {
            result.error.issues.forEach((err) => {
              this.allErrors.push(
                `[Validation Error] ${filePath} | ${item.key} | ${err.path.join(".")}: ${err.message}`,
              );
            });
            continue;
          }

          // Check against duplicates
          if (this.categoryRegistry.has(item.key)) {
            this.allErrors.push(`[Duplicate Error] Duplicate key "${item.key}" in "${filePath}".`);
            continue;
          }

          // Valid & Unique: Add to registry. Not Compiled yet, but we are in the process of it so fake it for now
          this.categoryRegistry.set(item.key, result.data as unknown as CompiledCategoryData);
        }
      } catch (e: any) {
        this.allErrors.push(`[JSON Error] Failed to parse ${filePath}: ${e.message}`);
      }
    }
  }

  private ingestTypeFiles(dir: string): void {
    if (!fs.existsSync(dir)) return;

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

        for (const [i, item] of items.entries()) {
          // Quick class check from key
          const className = item.key?.split(":")[0];
          if (!className.endsWith("Type")) {
            const key = item.key || `[${i}]`;
            this.allErrors.push(
              `[Prefix Error] Item "${key}" in "${filePath}" does not end with "Type".`,
            );
            continue;
          }

          // Validation
          const result = TypeObjectSchema.safeParse(item);
          if (!result.success) {
            result.error.issues.forEach((err) => {
              this.allErrors.push(
                `[Validation Error] ${filePath} | ${item.key} | ${err.path.join(".")}: ${err.message}`,
              );
            });
            continue;
          }

          // Check against duplicates
          if (this.typeRegistry.has(item.key)) {
            this.allErrors.push(`[Duplicate Error] Duplicate key "${item.key}" in "${filePath}".`);
            continue;
          }

          // Valid & Unique: Add to registry. Not Compiled yet, but we are in the process of it so fake it for now
          this.typeRegistry.set(item.key, result.data as unknown as CompiledTypeData);
        }
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

  private bake() {
    const safeAdd = <T>(array: T[] | undefined, item: T): T[] => {
      const arr = array || [];
      if (!arr.includes(item)) arr.push(item);
      return arr;
    };

    const trackMissing = (sourceKey: StaticKey, targetKey: StaticKey) => {
      if (
        !this.typeRegistry.has(targetKey as TypeKey) &&
        !this.categoryRegistry.has(targetKey as CatKey)
      ) {
        // Era exception (Era can be referred to as a category in TechnologyType but it is a type)
        if (targetKey.startsWith("eraType:") && this.typeRegistry.has(targetKey as TypeKey)) return;

        this.allErrors.push(
          `[Reference Error] "${sourceKey}" refers to missing key "${targetKey}"`,
        );
      }
    };

    // 1. Initial consistency check & Back-relations
    this.categoryRegistry.forEach((cat) => {
      trackMissing(cat.key, cat.concept);
    });

    this.typeRegistry.forEach((obj) => {
      trackMissing(obj.key, obj.concept);
      if (obj.category) trackMissing(obj.key, obj.category);

      // upgradesTo -> upgradesFrom
      obj.upgradesTo.forEach((targetKey) => {
        trackMissing(obj.key, targetKey);
        const target = this.typeRegistry.get(targetKey);
        if (target) {
          target.upgradesFrom = safeAdd(target.upgradesFrom, obj.key);
        }
      });

      // requires -> allows
      const allRequires = obj.requires.flat() as StaticKey[];
      allRequires.forEach((reqKey) => {
        trackMissing(obj.key, reqKey);
        const target =
          this.typeRegistry.get(reqKey as TypeKey) ?? this.categoryRegistry.get(reqKey as CatKey);
        if (target) {
          target.allows = safeAdd(target.allows, obj.key);
        }
      });

      // actions, gains, specials -> relatesTo
      ["actions", "gains", "specials"].forEach((field) => {
        // @bible-check 1.5: Dynamic field access for relation baking.
        const keys = obj[field as keyof CompiledTypeData] as TypeKey[];
        keys.forEach((targetKey) => {
          trackMissing(obj.key, targetKey);
          const target = this.typeRegistry.get(targetKey);
          if (target) {
            target.relatesTo = safeAdd(target.relatesTo, obj.key);
          }
        });
      });

      // yields -> relatesTo
      obj.yields?.forEach((y: any) => {
        trackMissing(obj.key, y.type);
        [...(y.for || []), ...(y.vs || [])].forEach((targetKey: StaticKey) => {
          trackMissing(obj.key, targetKey);
          const target =
            this.typeRegistry.get(targetKey as TypeKey) ||
            this.categoryRegistry.get(targetKey as CatKey);
          if (target) {
            target.relatesTo = safeAdd(target.relatesTo, obj.key);
          }
        });
      });

      // category -> relatesTo
      if (obj.category) {
        const cat =
          this.typeRegistry.get(obj.category as TypeKey) ||
          this.categoryRegistry.get(obj.category as CatKey);
        if (cat) {
          cat.relatesTo = safeAdd(cat.relatesTo, obj.key);
        }
      }
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
      `✓ Baked staticData.json (${data.types.length} types, ${data.categories.length} categories)`,
    );
  }

  private analyze() {
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
      JSON.stringify(analysis, null, 2), // todo minify for prod
    );
    console.log("✓ Analysis staticAnalysis.json generated");
  }
}

// Execute if run directly
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("StaticDataCompiler.ts") ||
    process.argv[1].endsWith("StaticDataCompiler.js") ||
    process.argv[1].includes("tsx"));

if (isMain) {
  new StaticDataCompiler().compile().catch((err) => {
    console.warn(err);
    process.exit(1);
  });
}
