import { describe, expect, it, vi } from "vitest";
import fs from "fs";
import { analyze } from "../../scripts/tools/analyzeStaticData";

vi.mock("fs", async () => {
  const actual = (await vi.importActual("fs")) as any;
  const mockFs = {
    ...actual,
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
  return {
    ...mockFs,
    default: mockFs,
  };
});

describe("analyzeStaticData Script", () => {
  it("should generate correct manifest and analysis", () => {
    const mockDataDir = "/mock/data";

    // Mock files in types and categories
    (fs.readdirSync as any).mockReturnValue([
      "types/actionType.json",
      "types/locked/domainType.json",
      "categories/buildingCategory.json",
    ]);
    (fs.existsSync as any).mockReturnValue(true);

    (fs.readFileSync as any).mockImplementation((path: string) => {
      if (path.endsWith("actionType.json")) {
        return JSON.stringify([
          { key: "actionType:move", name: "Move", concept: "conceptType:action" },
        ]);
      }
      if (path.endsWith("domainType.json")) {
        return JSON.stringify([
          { key: "domainType:land", name: "Land", concept: "conceptType:domain" },
        ]);
      }
      if (path.endsWith("buildingCategory.json")) {
        return JSON.stringify([
          {
            key: "buildingCategory:infrastructure",
            name: "Infrastructure",
            concept: "conceptType:building",
          },
        ]);
      }
      return "";
    });

    const result = analyze(mockDataDir);

    // 1. Manifest
    expect(result.manifest.types).toHaveLength(2);
    expect(result.manifest.types).toContain("actionType.json");
    expect(result.manifest.types).toContain("locked/domainType.json");
    expect(result.manifest.categories).toHaveLength(1);
    expect(result.manifest.categories).toContain("buildingCategory.json");

    // 2. Property Analysis
    expect(result.analysis.types.actionType).toBeDefined();
    expect(result.analysis.types.actionType!.key).toBe(1);
    expect(result.analysis.types.actionType!.name).toBe(1);
    expect(result.analysis.types.actionType!.concept).toBe(1);
  });

  it("should exclude manifest and analysis files from manifest", () => {
    (fs.readdirSync as any).mockReturnValue([
      "types/actionType.json",
      "manifest.json",
      "staticAnalysis.json",
      "schema.json",
    ]);
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue("[]");

    const result = analyze("/mock/data");

    expect(result.manifest.types).toHaveLength(1);
    expect(result.manifest.types).not.toContain("manifest.json");
    expect(result.manifest.types).not.toContain("staticAnalysis.json");
    expect(result.manifest.types).not.toContain("schema.json");
  });
});
