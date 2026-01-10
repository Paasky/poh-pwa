import fs from "fs";
import path from "path";
import { CategoryClass, TypeClass } from "../../src/Common/Objects/TypeObject";

const dataDir = path.join(process.cwd(), "public", "data");
const analysisPath = path.join(dataDir, "staticAnalysis.json");
const manifestPath = path.join(dataDir, "manifest.json");

export type Analysis = {
  types: Partial<Record<TypeClass, Record<string, number>>>;
  categories: Partial<Record<CategoryClass, Record<string, number>>>;
};

export function analyze(dataDir: string) {
  const analysis: Analysis = {
    types: {},
    categories: {},
  };
  const manifest: { types: string[]; categories: string[] } = { types: [], categories: [] };

  if (!fs.existsSync(dataDir)) {
    return { analysis, manifest };
  }

  const files = fs
    .readdirSync(dataDir, { recursive: true })
    .map((f) => f.toString().replace(/\\/g, "/"))
    .filter(
      (f) =>
        f.endsWith(".json") && !["staticAnalysis.json", "manifest.json", "schema.json"].includes(f),
    );

  for (const file of files) {
    const parts = file.split("/");
    const section = parts[0] as "types" | "categories";
    if (section !== "types" && section !== "categories") continue;

    manifest[section].push(parts.slice(1).join("/"));

    const items = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
    const itemList = Array.isArray(items) ? items : [items];

    for (const item of itemList) {
      const className = (item.key?.split(":")[0] ||
        item.concept?.split(":")[1] ||
        "unknown") as any;
      analysis[section][className] ??= {};
      for (const key of Object.keys(item)) {
        analysis[section][className][key] = (analysis[section][className][key] || 0) + 1;
      }
    }
  }

  const sort = (a: string, b: string) =>
    a.split("/").length - b.split("/").length || a.localeCompare(b);
  manifest.types.sort(sort);
  manifest.categories.sort(sort);

  return { analysis, manifest };
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("analyzeStaticData.ts") ||
    process.argv[1].endsWith("analyzeStaticData.js") ||
    process.argv[1].includes("tsx"));

if (isMain) {
  const dataDir = path.join(process.cwd(), "public", "data");
  const { analysis, manifest } = analyze(dataDir);

  const analysisPath = path.join(dataDir, "staticAnalysis.json");
  const manifestPath = path.join(dataDir, "manifest.json");

  fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✓ Analysis saved to ${path.relative(process.cwd(), analysisPath)}`);
  console.log(`✓ Manifest saved to ${path.relative(process.cwd(), manifestPath)}`);
}
