import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  crawlTiles,
  getCoordsFromTileKey,
  getDistance,
  getHexCornerNeighborDirections,
  getHexNeighbor,
  getHexNeighborDirections,
  getNeighborCoords,
  getRealCoords,
  getTile,
  tileHeight,
  tileKey,
} from "@/helpers/mapTools";
import { mockRandom } from "../_setup/testHelpers";
import { Tile } from "@/Common/Models/Tile";
import { createTestWorld } from "../_setup/testWorld";
import { destroyDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { initTestDataBucket } from "../_setup/dataHelpers";

describe("mapTools", () => {
  beforeEach(() => {
    initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  describe("tileHeight", () => {
    it("uses mocked random values for terrain height", () => {
      const objectsStore = useDataBucket();
      const restore = mockRandom(0.1, 0.9); // Will pick first and last from arrays usually if used with floor(random * length)
      // Wait, getRandom(arr) uses Math.floor(Math.random() * arr.length)
      // For ocean: [-1, -1.1, -1.2]
      // 0.1 * 3 = 0.3 -> index 0 -> -1
      // 0.9 * 3 = 2.7 -> index 2 -> -1.2

      const oceanTile = new Tile(
        "tile:x0,y0",
        0,
        0,
        objectsStore.getType("domainType:water"),
        objectsStore.getType("continentType:taiga"),
        objectsStore.getType("climateType:temperate"),
        objectsStore.getType("terrainType:ocean"),
        objectsStore.getType("elevationType:flat"),
      );

      expect(tileHeight(oceanTile)).toBe(-1);
      expect(tileHeight(oceanTile)).toBe(-1.2);

      restore();
    });

    it("returns fixed value when forLogic is true", () => {
      const objectsStore = useDataBucket();
      const oceanTile = new Tile(
        "tile:x0,y0",
        0,
        0,
        objectsStore.getType("domainType:water"),
        objectsStore.getType("continentType:taiga"),
        objectsStore.getType("climateType:temperate"),
        objectsStore.getType("terrainType:ocean"),
        objectsStore.getType("elevationType:flat"),
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
      const store = useDataBucket();
      const size = store.world.size;
      const tiles = store.getTiles();

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
      const store = useDataBucket();
      const size = store.world.size;
      const tiles = store.getTiles();
      const tile11 = tiles[Tile.getKey(1, 1)];

      // Odd row (1,1) neighbors: nw is (1,0)
      const nw = getHexNeighbor(size, tile11, tiles, "nw");
      expect(nw?.key).toBe(Tile.getKey(1, 0));

      // Even row (1,0) neighbors: nw is (0,-1) -> null
      const tile10 = tiles[Tile.getKey(1, 0)];
      expect(getHexNeighbor(size, tile10, tiles, "nw")).toBeNull();
    });

    it("getHexCornerNeighborDirections returns correct deltas", () => {
      // Even row
      const nEven = getHexCornerNeighborDirections(0, "n");
      expect(nEven).toContainEqual({ x: 0, y: -1 });
      expect(nEven).toContainEqual({ x: -1, y: -1 });

      // Odd row
      const nOdd = getHexCornerNeighborDirections(1, "n");
      expect(nOdd).toContainEqual({ x: 1, y: -1 });
      expect(nOdd).toContainEqual({ x: 0, y: -1 });
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

    it("getNeighborCoords hex distance 2", () => {
      const size = { x: 10, y: 10 };
      const center = { x: 5, y: 5 };
      const neighbors = getNeighborCoords(size, center, "hex", 2);
      // d=1: 6 neighbors
      // d=2: 12 more neighbors
      // total = 18
      expect(neighbors.length).toBe(18);
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

    it("getNeighborCoords handles large distance with wrapping", () => {
      const size = { x: 3, y: 3 };
      const center = { x: 1, y: 1 };
      // Small map, distance 2 should cover almost everything except center
      const neighbors = getNeighborCoords(size, center, "hex", 2);
      // Map has 9 tiles. 9 - 1 (center) = 8.
      expect(neighbors.length).toBe(8);
    });

    it("getNeighborCoords at polar edges", () => {
      const size = { x: 10, y: 10 };
      const top = { x: 5, y: 0 };
      const bottom = { x: 5, y: 9 };

      const topNeighbors = getNeighborCoords(size, top, "hex", 1);
      const bottomNeighbors = getNeighborCoords(size, bottom, "hex", 1);

      // Top row (y=0) is even.
      // Neighbors: w(4,0), e(6,0), sw(4,1), se(5,1). (nw and ne are out)
      expect(topNeighbors.length).toBe(4);

      // Bottom row (y=9) is odd.
      // Neighbors: w(4,9), e(6,9), nw(5,8), ne(6,8). (sw and se are out)
      expect(bottomNeighbors.length).toBe(4);
    });
  });

  describe("getDistance", () => {
    const size = { x: 10, y: 10 };

    it("calculates chebyshev distance correctly", () => {
      expect(getDistance(size, { x: 1, y: 1 }, { x: 1, y: 1 }, "chebyshev")).toBe(0);
      expect(getDistance(size, { x: 1, y: 1 }, { x: 2, y: 2 }, "chebyshev")).toBe(1);
      expect(getDistance(size, { x: 1, y: 1 }, { x: 3, y: 1 }, "chebyshev")).toBe(2);
      expect(getDistance(size, { x: 1, y: 1 }, { x: 1, y: 4 }, "chebyshev")).toBe(3);
    });

    it("calculates chebyshev distance with x-wrap", () => {
      // 0 to 9 is distance 1
      expect(getDistance(size, { x: 0, y: 5 }, { x: 9, y: 5 }, "chebyshev")).toBe(1);
      // 1 to 8 is distance 3
      expect(getDistance(size, { x: 1, y: 5 }, { x: 8, y: 5 }, "chebyshev")).toBe(3);
    });

    it("calculates manhattan distance correctly", () => {
      expect(getDistance(size, { x: 1, y: 1 }, { x: 1, y: 1 }, "manhattan")).toBe(0);
      expect(getDistance(size, { x: 1, y: 1 }, { x: 2, y: 2 }, "manhattan")).toBe(2);
      expect(getDistance(size, { x: 1, y: 1 }, { x: 3, y: 1 }, "manhattan")).toBe(2);
      expect(getDistance(size, { x: 1, y: 1 }, { x: 1, y: 4 }, "manhattan")).toBe(3);
    });

    it("calculates manhattan distance with x-wrap", () => {
      expect(getDistance(size, { x: 0, y: 5 }, { x: 9, y: 5 }, "manhattan")).toBe(1);
      expect(getDistance(size, { x: 1, y: 5 }, { x: 8, y: 5 }, "manhattan")).toBe(3);
    });

    it("calculates hex distance correctly", () => {
      // Direct neighbors
      expect(getDistance(size, { x: 1, y: 1 }, { x: 2, y: 1 }, "hex")).toBe(1); // E
      expect(getDistance(size, { x: 1, y: 1 }, { x: 0, y: 1 }, "hex")).toBe(1); // W
      expect(getDistance(size, { x: 1, y: 1 }, { x: 1, y: 0 }, "hex")).toBe(1); // NW (odd row)
      expect(getDistance(size, { x: 1, y: 1 }, { x: 2, y: 0 }, "hex")).toBe(1); // NE (odd row)

      // Further away
      expect(getDistance(size, { x: 1, y: 1 }, { x: 3, y: 1 }, "hex")).toBe(2);
      expect(getDistance(size, { x: 1, y: 1 }, { x: 1, y: 3 }, "hex")).toBe(2);
    });

    it("calculates hex distance with x-wrap", () => {
      expect(getDistance(size, { x: 0, y: 5 }, { x: 9, y: 5 }, "hex")).toBe(1);
      expect(getDistance(size, { x: 1, y: 5 }, { x: 8, y: 5 }, "hex")).toBe(3);
    });

    it("calculates hex distance with x-wrap on different grid sizes", () => {
      const oddSize = { x: 11, y: 10 };
      // 0 to 10 is distance 1
      expect(getDistance(oddSize, { x: 0, y: 5 }, { x: 10, y: 5 }, "hex")).toBe(1);
      // 1 to 9 is distance 3
      expect(getDistance(oddSize, { x: 1, y: 5 }, { x: 9, y: 5 }, "hex")).toBe(3);
    });

    it("calculates hex distance at polar edges", () => {
      // Distance between top-left and bottom-left shouldn't wrap around Y
      expect(getDistance(size, { x: 0, y: 0 }, { x: 0, y: 9 }, "hex")).toBe(9);
    });
  });

  describe("crawlTiles", () => {
    it("crawls only valid tiles", () => {
      createTestWorld();
      const store = useDataBucket();
      const tiles = store.getTiles();
      const startTile = tiles[Tile.getKey(1, 1)];

      // All tiles are valid except (2,1)
      const isValid = (tile: Tile) => tile.x !== 2 || tile.y !== 1;

      const results = crawlTiles(startTile, isValid);

      expect(results.has(Tile.getKey(1, 1))).toBe(true);
      expect(results.has(Tile.getKey(2, 1))).toBe(false);
      expect(results.size).toBeGreaterThan(1);
    });

    it("respects seenTiles and validTiles", () => {
      createTestWorld();
      const store = useDataBucket();
      const tiles = store.getTiles();
      const startTile = tiles[Tile.getKey(1, 1)];

      const seen = new Set<string>([Tile.getKey(1, 1)]);
      const valid = new Set<string>();

      crawlTiles(startTile, () => true, undefined, undefined, seen, valid);

      // Should return immediately because start is in seen
      expect(valid.size).toBe(0);
    });
  });
});
