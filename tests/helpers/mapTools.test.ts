import { beforeEach, describe, expect, it } from "vitest";
import {
  getCoordsFromTileKey,
  getHexNeighbor,
  getHexNeighborDirections,
  getNeighborCoords,
  getRealCoords,
  getTile,
  tileHeight,
  tileKey,
} from "../../src/helpers/mapTools";
import { mockRandom } from "../_setup/testHelpers";
import { Tile } from "../../src/objects/game/Tile";
import { initTestPinia, loadStaticData } from "../_setup/pinia";
import { useObjectsStore } from "../../src/stores/objectStore";
import { createTestWorld } from "../_setup/testWorld";

describe("mapTools", () => {
  beforeEach(() => {
    initTestPinia();
    loadStaticData();
  });

  describe("tileHeight", () => {
    it("uses mocked random values for terrain height", () => {
      const objectsStore = useObjectsStore();
      const restore = mockRandom(0.1, 0.9); // Will pick first and last from arrays usually if used with floor(random * length)
      // Wait, getRandom(arr) uses Math.floor(Math.random() * arr.length)
      // For ocean: [-1, -1.1, -1.2]
      // 0.1 * 3 = 0.3 -> index 0 -> -1
      // 0.9 * 3 = 2.7 -> index 2 -> -1.2

      const oceanTile = new Tile(
        "tile:x0,y0",
        0,
        0,
        objectsStore.getTypeObject("domainType:water"),
        objectsStore.getTypeObject("continentType:taiga"),
        objectsStore.getTypeObject("climateType:temperate"),
        objectsStore.getTypeObject("terrainType:ocean"),
        objectsStore.getTypeObject("elevationType:flat"),
      );

      expect(tileHeight(oceanTile)).toBe(-1);
      expect(tileHeight(oceanTile)).toBe(-1.2);

      restore();
    });

    it("returns fixed value when forLogic is true", () => {
      const objectsStore = useObjectsStore();
      const oceanTile = new Tile(
        "tile:x0,y0",
        0,
        0,
        objectsStore.getTypeObject("domainType:water"),
        objectsStore.getTypeObject("continentType:taiga"),
        objectsStore.getTypeObject("climateType:temperate"),
        objectsStore.getTypeObject("terrainType:ocean"),
        objectsStore.getTypeObject("elevationType:flat"),
      );
      expect(tileHeight(oceanTile, true)).toBe(-0.2); // waterLevel
    });

    it("throws when mockRandom runs out of values", () => {
      const restore = mockRandom(0.5);
      Math.random(); // consumes 0.5
      expect(() => Math.random()).toThrow("mockRandom: ran out of values");
      restore();
    });
  });

  describe("coordinate tools", () => {
    it("getCoordsFromTileKey parses correctly", () => {
      expect(getCoordsFromTileKey("tile:x1,y2" as any)).toEqual({ x: 1, y: 2 });
      expect(getCoordsFromTileKey("tile:x-5,y10" as any)).toEqual({ x: -5, y: 10 });
    });

    it("getCoordsFromTileKey throws on invalid format", () => {
      expect(() => getCoordsFromTileKey("invalid:key" as any)).toThrow("Invalid tile key format");
    });

    it("tileKey generates correct format", () => {
      expect(tileKey(5, 3)).toBe("tile:x5,y3");
    });

    it("getRealCoords handles wrapping", () => {
      const size = { x: 10, y: 10 };
      expect(getRealCoords(size, { x: 5, y: 5 })).toEqual({ x: 5, y: 5 });
      expect(getRealCoords(size, { x: 12, y: 5 })).toEqual({ x: 2, y: 5 });
      expect(getRealCoords(size, { x: -2, y: 5 })).toEqual({ x: 8, y: 5 });
      expect(getRealCoords(size, { x: 5, y: -1 })).toBeNull();
      expect(getRealCoords(size, { x: 5, y: 10 })).toBeNull();
    });

    it("getTile returns tile or null", () => {
      createTestWorld();
      const store = useObjectsStore();
      const size = store.world.size;
      const tiles = store.getTiles;

      expect(getTile(size, { x: 1, y: 1 }, tiles)).toBe(tiles[Tile.getKey(1, 1)]);
      expect(getTile(size, { x: 5, y: 1 }, tiles)).toBe(tiles[Tile.getKey(0, 1)]); // wraps
      expect(getTile(size, { x: 1, y: 5 }, tiles)).toBeNull(); // out of bounds y
    });
  });

  describe("neighbor tools", () => {
    it("getHexNeighborDirections varies by row parity", () => {
      const evenDirs = getHexNeighborDirections(0);
      const oddDirs = getHexNeighborDirections(1);

      expect(evenDirs.nw).toEqual({ x: -1, y: -1 });
      expect(oddDirs.nw).toEqual({ x: 0, y: -1 });
    });

    it("getHexNeighbor finds specific neighbor", () => {
      createTestWorld();
      const store = useObjectsStore();
      const size = store.world.size;
      const tiles = store.getTiles;
      const tile11 = tiles[Tile.getKey(1, 1)];

      // Odd row (1,1) neighbors: nw is (1,0)
      const nw = getHexNeighbor(size, tile11, tiles, "nw");
      expect(nw?.key).toBe(Tile.getKey(1, 0));

      // Even row (1,0) neighbors: nw is (0,-1) -> null
      const tile10 = tiles[Tile.getKey(1, 0)];
      expect(getHexNeighbor(size, tile10, tiles, "nw")).toBeNull();
    });

    it("getNeighborCoords hex distance 1", () => {
      const size = { x: 5, y: 5 };
      const center = { x: 1, y: 1 }; // odd row
      const neighbors = getNeighborCoords(size, center, "hex", 1);

      // Odd row (1,1) neighbors:
      // w: (0,1), e: (2,1), nw: (1,0), ne: (2,0), sw: (1,2), se: (2,2)
      expect(neighbors).toContainEqual({ x: 0, y: 1 });
      expect(neighbors).toContainEqual({ x: 2, y: 1 });
      expect(neighbors).toContainEqual({ x: 1, y: 0 });
      expect(neighbors).toContainEqual({ x: 2, y: 0 });
      expect(neighbors).toContainEqual({ x: 1, y: 2 });
      expect(neighbors).toContainEqual({ x: 2, y: 2 });
      expect(neighbors.length).toBe(6);
    });

    it("getNeighborCoords chebyshev distance 1", () => {
      const size = { x: 5, y: 5 };
      const center = { x: 1, y: 1 };
      const neighbors = getNeighborCoords(size, center, "chebyshev", 1);

      expect(neighbors.length).toBe(8);
      expect(neighbors).toContainEqual({ x: 0, y: 0 });
      expect(neighbors).toContainEqual({ x: 2, y: 2 });
    });

    it("getNeighborCoords handles wrapping", () => {
      const size = { x: 5, y: 5 };
      const center = { x: 0, y: 0 }; // even row
      const neighbors = getNeighborCoords(size, center, "hex", 1);

      // Even row (0,0) neighbors:
      // w: (-1,0)->(4,0), e: (1,0), nw: (-1,-1)->out, ne: (0,-1)->out, sw: (-1,1)->(4,1), se: (0,1)
      expect(neighbors).toContainEqual({ x: 4, y: 0 });
      expect(neighbors).toContainEqual({ x: 1, y: 0 });
      expect(neighbors).toContainEqual({ x: 4, y: 1 });
      expect(neighbors).toContainEqual({ x: 0, y: 1 });
      expect(neighbors.length).toBe(4);
    });
  });
});
