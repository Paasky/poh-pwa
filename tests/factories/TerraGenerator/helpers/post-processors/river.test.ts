import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeRiver } from "../../../../../src/factories/TerraGenerator/helpers/post-processors";
import { initTestPinia, loadStaticData } from "../../../../_setup/pinia";
import { Tile } from "../../../../../src/objects/game/_GameObject";

// Only allowed mock: stabilize RNG for determinism in this test file
const realRandom = Math.random;
beforeEach(() => {
  Math.random = () => 0.5;
});
afterEach(() => {
  Math.random = realRandom;
});

describe("river", () => {
  const size = { x: 10, y: 10 };
  let tiles: Record<string, any>;
  let rivers: Record<string, any>;

  const mkTile = (x: number, y: number) => ({
    x,
    y,
    key: Tile.getKey(x, y),
    isSalt: false,
    isFresh: false,
    isMajorRiver: false,
    riverKey: null as string | null,
    domain: { id: "land" },
    climate: { id: "temperate" },
    terrain: { id: "grass" },
    elevation: { id: "flat" },
    feature: { value: null as any },
  });

  beforeEach(() => {
    initTestPinia();
    loadStaticData();
    tiles = {};
    rivers = {};
    // Pre-populate a full grid so neighbors lookups always succeed
    for (let y = 0; y < size.y; y++) {
      for (let x = 0; x < size.x; x++) {
        const t = mkTile(x, y);
        tiles[t.key] = t;
      }
    }
  });

  it("creates a River, marks walked tiles and freshens neighbors", () => {
    const start = tiles[Tile.getKey(0, 0)];
    const r = makeRiver(size, start, tiles, rivers);
    expect(r).toBeTruthy();
    // Walked tiles are 3 (from mock snake route)
    expect(r.tileKeys.value.length).toBeGreaterThan(0);
    for (const key of r.tileKeys.value) {
      const t = tiles[key];
      expect(t.riverKey).toBe(r.key);
      expect(t.isFresh).toBe(true);
    }
    // At least one neighbor of walked tiles should be set fresh in finalize loop if present
    const anyNeighborFresh = Object.values(tiles).some(
      (t) => t.isFresh && !t.riverKey,
    );
    expect(anyNeighborFresh).toBe(true);
  });

  it("stops when reaching salt water", () => {
    // Create a fresh grid and set the immediate next tile to salt
    const tiles2: Record<string, any> = {};
    const rivers2: Record<string, any> = {};
    for (let y = 0; y < size.y; y++) {
      for (let x = 0; x < size.x; x++) {
        const t = mkTile(x, y);
        tiles2[t.key] = t;
      }
    }
    const a = tiles2[Tile.getKey(0, 0)];
    // Make all tiles except the start salt water to force immediate stop regardless of direction
    for (const t of Object.values(tiles2)) {
      if (t.key !== a.key) t.isSalt = true;
    }
    const r = makeRiver(size, a, tiles2, rivers2);
    // Because accept should return false on salt, walked length must be <=1
    expect(r.tileKeys.value.length).toBeLessThanOrEqual(1);
  });

  it("marks other river downstream as major when merging", () => {
    // Build an existing river whose path includes the confluence tile directly south of start
    const existing = [Tile.getKey(0, 1), Tile.getKey(0, 2)];
    for (const k of existing) {
      const [, xs, ys] = /tile:x(\d+),y(\d+)/.exec(k) as any;
      const x = Number(xs),
        y = Number(ys);
      const base = tiles[k] || mkTile(x, y);
      tiles[k] = {
        ...base,
        key: k,
        x,
        y,
        isFresh: true,
        riverKey: "river:existing",
      };
    }

    // Register the other river object in the rivers map passed into river()
    const otherRiver = {
      key: "river:existing",
      tileKeys: { value: existing.slice() },
    } as any;
    rivers[otherRiver.key] = otherRiver;

    // Ensure confluence tile (south) is tagged as existing river so accept returns false and we merge
    tiles[Tile.getKey(0, 1)].riverKey = "river:existing";

    const r = makeRiver(size, tiles[Tile.getKey(0, 0)] as any, tiles, rivers);
    expect(r.tileKeys.value.length).toBeGreaterThan(0);
    // After confluence, other river from that tile onwards should be marked as major
    const startIdx = otherRiver.tileKeys.value.indexOf(Tile.getKey(0, 1));
    for (let i = startIdx; i < otherRiver.tileKeys.value.length; i++) {
      const tk = otherRiver.tileKeys.value[i];
      expect(tiles[tk].isMajorRiver).toBe(true);
    }
  });

  it("continues through lakes (not stopping on lake terrain/domain)", () => {
    // Make middle tile a lake, not salt
    tiles[Tile.getKey(1, 0)].terrain = { id: "lake" };
    const r = makeRiver(size, tiles[Tile.getKey(0, 0)] as any, tiles, rivers);
    expect(r.tileKeys.value.length).toBeGreaterThan(0);
  });

  it("removes features from tiles the river flows through", () => {
    // Put a feature on the start tile to guarantee it is visited
    const shrubs = { key: "featureType:shrubs" } as any;
    const start = tiles[Tile.getKey(0, 0)];
    start.feature.value = shrubs;

    const r = makeRiver(size, start as any, tiles, rivers);
    expect(r.tileKeys.value.length).toBeGreaterThan(0);
    // Start tile must have lost its feature
    expect(start.feature.value).toBeNull();
  });

  it("when next to a lake, forces direction into a lake; entering a lake makes river major from there on", () => {
    const start = tiles[Tile.getKey(4, 4)];
    // Surround start with lakes in all 8 neighboring tiles
    const neighborOffsets = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];
    for (const [dx, dy] of neighborOffsets) {
      const nx = (start.x + dx + size.x) % size.x;
      const ny = start.y + dy;
      if (ny < 0 || ny >= size.y) continue;
      tiles[Tile.getKey(nx, ny)].terrain = { id: "lake" };
    }

    const r = makeRiver(size, start as any, tiles, rivers);
    expect(r.tileKeys.value.length).toBeGreaterThan(1);

    // First moved tile after start must be a lake
    const firstStepKey = r.tileKeys.value[1];
    const firstStep = tiles[firstStepKey];
    expect(firstStep.terrain.id).toBe("lake");
    expect(firstStep.isMajorRiver).toBe(true);

    // All tiles from first lake onwards should be major
    const idx = 1;
    for (let i = idx; i < r.tileKeys.value.length; i++) {
      expect(tiles[r.tileKeys.value[i]].isMajorRiver).toBe(true);
    }
  });

  it("stops when next to another river and promotes its neighbors and downstream to major", () => {
    // Build another river as a 2x2 block at (5,5)-(6,6)
    const otherKey = "river:other";
    const otherTiles = [
      Tile.getKey(5, 5),
      Tile.getKey(6, 5),
      Tile.getKey(6, 6),
      Tile.getKey(5, 6),
    ];
    for (const k of otherTiles) {
      const m = tiles[k];
      m.riverKey = otherKey;
      m.isFresh = true;
    }
    const otherRiver = {
      key: otherKey,
      tileKeys: { value: otherTiles.slice() },
    } as any;
    rivers[otherKey] = otherRiver;

    // Start next to (5,5) at (4,5) so we are adjacent to the other river immediately
    const start = tiles[Tile.getKey(4, 5)];
    const r = makeRiver(size, start as any, tiles, rivers);
    // Should have only start tile walked (stopped immediately due to adjacency)
    expect(r.tileKeys.value.length).toBe(1);

    // Confluence tile neighbors that are part of other river should be major
    const confluence = tiles[Tile.getKey(5, 5)];
    const neighborKeys = [
      Tile.getKey(6, 5),
      Tile.getKey(5, 6),
      Tile.getKey(6, 6),
    ];
    for (const nk of neighborKeys) {
      expect(tiles[nk].isMajorRiver).toBe(true);
    }

    // All following tiles of the other river from (5,5) onward become major
    const startIdx = otherRiver.tileKeys.value.indexOf(confluence.key);
    for (let i = startIdx; i < otherRiver.tileKeys.value.length; i++) {
      expect(tiles[otherRiver.tileKeys.value[i]].isMajorRiver).toBe(true);
    }
  });

  it("freshens adjacent desert tiles; empty becomes flood plain, shrubs stay but gain fresh water", () => {
    const start = tiles[Tile.getKey(0, 0)];

    // Prepare two adjacent desert tiles to the start tile (which is guaranteed in the walked list)
    const east = tiles[Tile.getKey(1, 0)];
    // Use west neighbor for shrubs to avoid the initial southward river step
    const west = tiles[Tile.getKey(9, 0)];

    east.terrain = { id: "desert" };
    east.feature.value = null;

    west.terrain = { id: "desert" };
    west.feature.value = { key: "featureType:shrubs" } as any;

    const r = makeRiver(size, start as any, tiles, rivers);
    expect(r.tileKeys.value.length).toBeGreaterThan(0);

    // East had no feature: should become flood plain and be fresh
    expect(east.isFresh).toBe(true);
    expect(east.feature.value?.key).toBe("featureType:floodPlain");

    // West had shrubs: should remain shrubs and be fresh (no flood plain override)
    expect(west.isFresh).toBe(true);
    expect(west.feature.value?.key).toBe("featureType:shrubs");
  });
});
