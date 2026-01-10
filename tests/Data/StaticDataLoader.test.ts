import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStaticData } from "../../src/Data/StaticDataLoader";

describe("StaticDataLoader", () => {
  const mockManifest = {
    types: ["domainType.json", "technologyType.json"],
    categories: ["buildingCategory.json"],
  };

  const mockDomainType = [
    {
      key: "domainType:land",
      name: "Land",
      concept: "conceptType:domain",
    },
  ];

  const mockTechType = [
    {
      key: "technologyType:agriculture",
      name: "Agriculture",
      concept: "conceptType:technology",
      category: "technologyCategory:ancient",
      requires: ["technologyType:nomadism"],
    },
  ];

  const mockBuildingCat = {
    key: "buildingCategory:infrastructure",
    name: "Infrastructure",
    concept: "conceptType:building",
  };

  beforeEach(async () => {
    vi.stubGlobal("fetch", async (url: string) => {
      if (url.endsWith("manifest.json")) {
        return { ok: true, status: 200, json: async () => mockManifest };
      }
      if (url.endsWith("domainType.json")) {
        return { ok: true, status: 200, json: async () => mockDomainType };
      }
      if (url.endsWith("technologyType.json")) {
        return { ok: true, status: 200, json: async () => mockTechType };
      }
      if (url.endsWith("buildingCategory.json")) {
        return { ok: true, status: 200, json: async () => mockBuildingCat };
      }
      return { ok: false, status: 404, statusText: "Not Found" };
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should load and merge data correctly from manifest", async () => {
    const data = await getStaticData();

    expect(data.types).toHaveLength(2);
    expect(data.categories).toHaveLength(1);

    expect(data.types.find((t) => t.key === "domainType:land")).toBeDefined();
    expect(data.types.find((t) => t.key === "technologyType:agriculture")).toBeDefined();
    expect(data.categories.find((c) => c.key === "buildingCategory:infrastructure")).toBeDefined();
  });

  it("should throw error on validation failure (missing concept)", async () => {
    vi.stubGlobal("fetch", async (url: string) => {
      if (url.endsWith("manifest.json")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ types: ["badType.json"], categories: [] }),
        };
      }
      if (url.endsWith("badType.json")) {
        return {
          ok: true,
          status: 200,
          json: async () => [{ key: "actionType:move", name: "Move" }], // missing concept
        };
      }
      return { ok: false, status: 404 };
    });

    await expect(getStaticData()).rejects.toThrow();
  });

  it("should throw error on key consistency failure", async () => {
    vi.stubGlobal("fetch", async (url: string) => {
      if (url.endsWith("manifest.json")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ types: ["actionType.json"], categories: [] }),
        };
      }
      if (url.endsWith("actionType.json")) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            { key: "buildingType:granary", name: "Granary", concept: "conceptType:building" },
          ],
        };
      }
      return { ok: false, status: 404 };
    });

    await expect(getStaticData()).rejects.toThrow(/Key consistency error/);
  });
});
