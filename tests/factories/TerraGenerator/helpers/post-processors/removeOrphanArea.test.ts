import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/helpers/arrayTools", () => ({
  getRandom: (arr: any[]) => arr[0],
  takeRandom: (arr: any[]) => arr.pop(),
}));

// Minimal GenTile-like object
const mkTile = (over: Partial<any> = {}) => ({
  area: { key: "A" },
  domain: { key: "domainType:land" },
  climate: { id: "temperate" },
  terrain: { key: "terrainType:grass", id: "grass" },
  canChangeDomain: () => true,
  ...over,
});

// Import after mocks
import { removeOrphanArea } from "../../../../../src/factories/TerraGenerator/helpers/post-processors";

describe("removeOrphanArea", () => {
  let tile: any;
  beforeEach(() => {
    tile = mkTile();
  });

  it("does nothing if any neighbor has same area", () => {
    const n = [mkTile({ area: { key: "A" } })];
    removeOrphanArea(tile, n);
    expect(tile.area.key).toBe("A");
  });

  it("does nothing if all neighbors are different domain (lake/island case)", () => {
    const n = [mkTile({ domain: { key: "domainType:water" } })];
    removeOrphanArea(tile, n);
    expect(tile.area.key).toBe("A");
  });

  it("changes area and possibly domain/climate/terrain based on random neighbor", () => {
    // Put the water neighbor first so mocked getRandom (arr[0]) picks it,
    // and add a second neighbor with same domain to avoid allDiffDomain short-circuit
    const neighbor = mkTile({
      area: { key: "B" },
      domain: { key: "domainType:water" },
      climate: { id: "cold" },
      terrain: { key: "terrainType:ocean", id: "ocean" },
    });
    const sameDomainNeighbor = mkTile({
      area: { key: "Z" },
      domain: { key: "domainType:land" },
    });
    removeOrphanArea(tile, [neighbor, sameDomainNeighbor]);
    expect(tile.area.key).toBe("B");
    expect(tile.domain.key).toBe("domainType:water");
    expect(tile.climate.id).toBe("cold");
    expect(tile.terrain.id).toBe("ocean");
  });

  it("only changes area when canChangeDomain=false even if neighbor domain differs", () => {
    const neighbor = mkTile({
      area: { key: "B" },
      domain: { key: "domainType:water" },
      climate: { id: "cold" },
      terrain: { key: "terrainType:ocean", id: "ocean" },
    });
    const imm = mkTile({ canChangeDomain: () => false });
    const sameDomainNeighbor = mkTile({
      area: { key: "Z" },
      domain: { key: "domainType:land" },
    });
    removeOrphanArea(imm, [neighbor, sameDomainNeighbor]);
    expect(imm.area.key).toBe("B");
    // unchanged domain/climate/terrain
    expect(imm.domain.key).toBe("domainType:land");
    expect(imm.climate.id).toBe("temperate");
    expect(imm.terrain.id).toBe("grass");
  });
});
