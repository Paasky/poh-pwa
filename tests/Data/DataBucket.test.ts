import { describe, expect, it } from "vitest";
import { StaticDataCompiler } from "@/Data/StaticDataCompiler";
import { DataBucket } from "@/Data/DataBucket";
import { useDataBucket } from "@/Data/useDataBucket";
import fs from "fs";
import path from "path";

describe("DataBucket Integration Tests", () => {
  it("should compile, load, and validate regionCategory:taiga and regionType:scandinavia", async () => {
    // 1. Run StaticDataCompiler
    const compiler = new StaticDataCompiler();
    compiler.compile();

    const outputFilePath = path.join(process.cwd(), "public", "data", "staticData.json");
    expect(fs.existsSync(outputFilePath)).toBe(true);

    const compiledData = JSON.parse(fs.readFileSync(outputFilePath, "utf8"));

    // 2. Initialize DataBucket with the compiled data
    // DataBucket.init(compiledData) will call StaticDataLoader.load(compiledData) and setDataBucket
    await DataBucket.init(compiledData);
    const bucket = useDataBucket();

    // 3. Validate regionCategory:taiga
    const taigaCategory = bucket.getCategory("regionCategory:taiga");
    expect(taigaCategory).toBeDefined();
    expect(taigaCategory.key).toBe("regionCategory:taiga");
    expect(taigaCategory.name).toBe("Taiga");
    expect(taigaCategory.class).toBe("regionCategory");
    expect(taigaCategory.concept).toBe("conceptType:region");
    expect(Object.isFrozen(taigaCategory)).toBe(true);

    // 4. Validate regionType:scandinavia
    const scandinaviaType = bucket.getType("regionType:scandinavia");
    expect(scandinaviaType).toBeDefined();
    expect(scandinaviaType.key).toBe("regionType:scandinavia");
    expect(scandinaviaType.name).toBe("Scandinavia");
    expect(scandinaviaType.class).toBe("regionType");
    expect(scandinaviaType.concept).toBe("conceptType:region");
    expect(scandinaviaType.category).toBe("regionCategory:taiga");
    expect(Object.isFrozen(scandinaviaType)).toBe(true);

    // Additional data check for scandinavia
    expect(scandinaviaType.cities).toContain("Stockholm");
    expect(scandinaviaType.requires.requireAll.has("continentType:taiga")).toBe(true);
  });
});
