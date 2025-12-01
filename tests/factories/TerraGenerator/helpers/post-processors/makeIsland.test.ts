import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeIsland } from "../../../../../src/factories/TerraGenerator/helpers/post-processors";
import { getTile } from "../../../../../src/factories/TerraGenerator/helpers/neighbors";
import { Tile } from "../../../../../src/objects/game/Tile";

vi.mock("@/factories/TerraGenerator/helpers/tetris", () => ({
  // Include -1,0,+1 to test wrap-around behavior too
  Tetris: {
    randomOffsets: () => [
      { dx: -1, dy: 0 },
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
    ],
  },
}));

const land = { id: "land", key: "domainType:land" };
const water = { id: "water", key: "domainType:water" };
const hill = { id: "hill" };
const flat = { id: "flat" };
const grass = { id: "terrainType:grass", key: "terrainType:grass" };

const mkGen = () => {
  const tiles: Record<string, any> = {};
  const size = { x: 5, y: 5 };
  const getKey = (x: number, y: number) =>
    Tile.getKey((x + size.x) % size.x, Math.max(0, Math.min(size.y - 1, y)));
  const getTile = (x: number, y: number) => {
    const key = getKey(x, y);
    if (!tiles[key])
      tiles[key] = {
        key,
        x: (x + size.x) % size.x,
        y: Math.max(0, Math.min(size.y - 1, y)),
        domain: water,
        climate: { id: "temperate" },
        terrain: { id: "ocean", key: "terrainType:ocean" },
        elevation: flat,
        isSalt: false,
        isFresh: false,
        canChangeDomain: () => true,
      };
    return tiles[key];
  };
  return {
    size,
    regSize: size,
    regTiles: tiles,
    gameTiles: tiles,
    land,
    flat,
    hill,
    getTile,
    getLandTerrainFromClimate: () => grass,
  };
};

describe("makeIsland", () => {
  let gen: any;
  beforeEach(() => {
    gen = mkGen();
    // Pre-populate tile records so helpers/neighbors.getTile can find tiles
    for (let y = 0; y < gen.size.y; y++) {
      for (let x = 0; x < gen.size.x; x++) {
        gen.getTile(x, y);
      }
    }
  });

  it("converts eligible tiles to land with selected elevation (hillChance=1 -> hill)", () => {
    const x = 2,
      y = 2;
    makeIsland(gen, { x, y }, "game", 1);
    const t0 = getTile(gen.size, { x, y }, gen.gameTiles);
    const tL = getTile(gen.size, { x: x - 1, y }, gen.gameTiles);
    const tR = getTile(gen.size, { x: x + 1, y }, gen.gameTiles);
    for (const t of [tL, t0, tR]) {
      expect(t.domain).toBe(land);
      expect(t.terrain).toBe(grass);
      expect(t.elevation).toBe(hill);
      expect(t.isFresh).toBe(false);
      expect(t.isSalt).toBe(false);
    }
  });

  it("wraps horizontally when centered at x=0 and 3-wide offsets are used", () => {
    const cx = 0,
      cy = 1;
    makeIsland(gen, { x: cx, y: cy }, "game", 0); // hillChance=0 -> flat
    // With offsets -1,0,+1 and wrap on X, tiles x=4,0,1 become land
    const leftWrap = getTile(gen.size, { x: -1, y: cy }, gen.gameTiles);
    const center = getTile(gen.size, { x: 0, y: cy }, gen.gameTiles);
    const right = getTile(gen.size, { x: 1, y: cy }, gen.gameTiles);
    for (const t of [leftWrap, center, right]) {
      expect(t.domain).toBe(land);
      expect(t.terrain).toBe(grass);
      expect(t.elevation).toBe(flat);
    }
  });

  it("respects canChangeDomain=false and only updates area when allowed (no-op here)", () => {
    const cx = 2,
      cy = 2;
    // Make a specific tile immutable
    const imm = getTile(gen.size, { x: cx, y: cy }, gen.gameTiles);
    imm.canChangeDomain = () => false;
    const before = {
      domain: imm.domain,
      terrain: imm.terrain,
      elevation: imm.elevation,
    };
    makeIsland(gen, { x: cx, y: cy }, "game", 1);
    // The center tile should remain unchanged
    expect(imm.domain).toBe(before.domain);
    expect(imm.terrain).toBe(before.terrain);
    expect(imm.elevation).toBe(before.elevation);
  });
});
