import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/helpers/arrayTools", () => ({
  getRandom: (arr: any[]) => arr[0],
  takeRandom: (arr: any[]) => arr.pop(),
}));

const mkTile = (over: Partial<any> = {}) => ({
  area: { key: "A" },
  domain: { key: "domainType:land" },
  climate: { id: "temperate" },
  terrain: { key: "terrainType:grass", id: "grass" },
  canChangeDomain: () => true,
  ...over,
});

import { removeOrphanTerrain } from "../../../../../src/factories/TerraGenerator/helpers/post-processors";

describe("removeOrphanTerrain", () => {
  let tile: any;
  beforeEach(() => {
    tile = mkTile();
  });

  it("does nothing when some neighbor has same terrain", () => {
    const n = [mkTile({ terrain: { key: "terrainType:grass", id: "grass" } })];
    removeOrphanTerrain(tile, n);
    expect(tile.terrain.id).toBe("grass");
  });

  it("changes to neighbor domain/terrain when all neighbors diff, respecting lakes by default", () => {
    const neighbor = mkTile({
      domain: { key: "domainType:water" },
      terrain: { key: "terrainType:lake", id: "lake" },
    });
    removeOrphanTerrain(tile, [neighbor]);
    // Should not convert land to lake when ignoreLakes=true
    expect(tile.domain.key).toBe("domainType:land");
    expect(tile.terrain.id).toBe("grass");
  });

  it("converts to neighbor lake when ignoreLakes=false", () => {
    const neighbor = mkTile({
      domain: { key: "domainType:water" },
      terrain: { key: "terrainType:lake", id: "lake" },
    });
    removeOrphanTerrain(tile, [neighbor], false);
    expect(tile.domain.key).toBe("domainType:water");
    expect(tile.terrain.id).toBe("lake");
  });

  it("updates area/climate/terrain when domain changes and lakes not involved", () => {
    const neighbor = mkTile({
      area: { key: "B" },
      domain: { key: "domainType:water" },
      climate: { id: "cold" },
      terrain: { key: "terrainType:ocean", id: "ocean" },
    });
    removeOrphanTerrain(tile, [neighbor], true);
    // With ignoreLakes=true and neighbor not a lake, we allow domain flip
    expect(tile.domain.key).toBe("domainType:water");
    expect(tile.climate.id).toBe("cold");
    expect(tile.terrain.id).toBe("ocean");
    expect(tile.area.key).toBe("B");
  });
});
