import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  crawlTiles,
  getCoordsFromTileKey,
  getDistance,
  getHexCornerNeighborDirections,
  getHexCornerNeighbors,
  getHexNeighbor,
  getHexNeighborDirections,
  getNeighborCoords,
  getNeighbors,
  getRealCoords,
  getTile,
  tileHeight,
  tileKey,
  toCube,
  wrapX,
} from "@/Common/Helpers/mapTools";
import { rng } from "@/Common/Helpers/Rng";
import { Tile } from "@/Common/Models/Tile";
import { createTestWorld } from "../../_setup/testWorld";
import { destroyDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { initTestDataBucket } from "../../_setup/dataHelpers";

describe("mapTools", () => {
  beforeEach(async () => {
    await initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  describe("tileHeight", () => {
    it("uses mocked random values for terrain height", () => {
      const objectsStore = useDataBucket();
      const cleanup = rng.mock([0.1, 0.9]);

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

      cleanup();
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

    it("wrapX handles positive and negative values", () => {
      const size = { x: 10, y: 10 };
      expect(wrapX(size, 5)).toBe(5);
      expect(wrapX(size, 10)).toBe(0);
      expect(wrapX(size, 15)).toBe(5);
      expect(wrapX(size, -1)).toBe(9);
      expect(wrapX(size, -11)).toBe(9);
    });

    it("toCube converts axial to cube coordinates", () => {
      expect(toCube({ x: 0, y: 0 })).toEqual({ q: 0, r: 0, s: 0 });
      expect(toCube({ x: 1, y: 0 })).toEqual({ q: 1, r: 0, s: -1 });
      expect(toCube({ x: 0, y: 1 })).toEqual({ q: 0, r: 1, s: -1 });
      expect(toCube({ x: 1, y: 1 })).toEqual({ q: 1, r: 1, s: -2 });
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

      const nw = getHexNeighbor(size, tile11, tiles, "nw");
      expect(nw?.key).toBe(Tile.getKey(1, 0));

      const tile10 = tiles[Tile.getKey(1, 0)];
      expect(getHexNeighbor(size, tile10, tiles, "nw")).toBeNull();
    });

    it("getHexCornerNeighborDirections returns correct deltas", () => {
      const nEven = getHexCornerNeighborDirections(0, "n");
      expect(nEven).toContainEqual({ x: 0, y: -1 });
      expect(nEven).toContainEqual({ x: -1, y: -1 });

      const nOdd = getHexCornerNeighborDirections(1, "n");
      expect(nOdd).toContainEqual({ x: 1, y: -1 });
      expect(nOdd).toContainEqual({ x: 0, y: -1 });
    });

    it("getHexCornerNeighbors finds neighbors at corners", () => {
      createTestWorld();
      const store = useDataBucket();
      const size = store.world.size;
      const tiles = store.getTiles();
      const tile11 = tiles[Tile.getKey(1, 1)];

      const nNeighbors = getHexCornerNeighbors(size, tile11, tiles, "n");
      expect(nNeighbors.length).toBe(2);
      expect(nNeighbors.map((t) => t.key)).toContain(Tile.getKey(2, 0));
      expect(nNeighbors.map((t) => t.key)).toContain(Tile.getKey(1, 0));
    });

    it("getNeighborCoords hex distance 1", () => {
      const size = { x: 5, y: 5 };
      const center = { x: 1, y: 1 };
      const neighbors = getNeighborCoords(size, center, "hex", 1);

      expect(neighbors).toContainEqual({ x: 0, y: 1 });
      expect(neighbors).toContainEqual({ x: 2, y: 1 });
      expect(neighbors).toContainEqual({ x: 1, y: 0 });
      expect(neighbors).toContainEqual({ x: 2, y: 0 });
      expect(neighbors).toContainEqual({ x: 1, y: 2 });
      expect(neighbors).toContainEqual({ x: 2, y: 2 });
      expect(neighbors.length).toBe(6);
    });

    it("getNeighbors returns actual tile objects", () => {
      createTestWorld();
      const store = useDataBucket();
      const size = store.world.size;
      const tiles = store.getTiles();
      const center = { x: 1, y: 1 };

      const neighbors = getNeighbors(size, center, tiles, "hex", 1);
      expect(neighbors.length).toBe(6);
      neighbors.forEach((t) => {
        expect(t).toBeInstanceOf(Tile);
        expect(t.key).toBe(Tile.getKey(t.x, t.y));
      });
    });

    it("getNeighborCoords hex distance 2", () => {
      const size = { x: 10, y: 10 };
      const center = { x: 5, y: 5 };
      const neighbors = getNeighborCoords(size, center, "hex", 2);
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
      const center = { x: 0, y: 0 };
      const neighbors = getNeighborCoords(size, center, "hex", 1);

      expect(neighbors).toContainEqual({ x: 4, y: 0 });
      expect(neighbors).toContainEqual({ x: 1, y: 0 });
      expect(neighbors).toContainEqual({ x: 4, y: 1 });
      expect(neighbors).toContainEqual({ x: 0, y: 1 });
      expect(neighbors.length).toBe(4);
    });

    it("getNeighborCoords at polar edges", () => {
      const size = { x: 10, y: 10 };
      const top = { x: 5, y: 0 };
      const bottom = { x: 5, y: 9 };

      const topNeighbors = getNeighborCoords(size, top, "hex", 1);
      const bottomNeighbors = getNeighborCoords(size, bottom, "hex", 1);

      expect(topNeighbors.length).toBe(4);
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
      expect(getDistance(size, { x: 0, y: 5 }, { x: 9, y: 5 }, "chebyshev")).toBe(1);
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
      expect(getDistance(size, { x: 1, y: 1 }, { x: 2, y: 1 }, "hex")).toBe(1);
      expect(getDistance(size, { x: 1, y: 1 }, { x: 0, y: 1 }, "hex")).toBe(1);
      expect(getDistance(size, { x: 1, y: 1 }, { x: 1, y: 0 }, "hex")).toBe(1);
      expect(getDistance(size, { x: 1, y: 1 }, { x: 2, y: 0 }, "hex")).toBe(1);

      expect(getDistance(size, { x: 1, y: 1 }, { x: 3, y: 1 }, "hex")).toBe(2);
      expect(getDistance(size, { x: 1, y: 1 }, { x: 1, y: 3 }, "hex")).toBe(2);
    });

    it("calculates hex distance with x-wrap", () => {
      expect(getDistance(size, { x: 0, y: 5 }, { x: 9, y: 5 }, "hex")).toBe(1);
      expect(getDistance(size, { x: 1, y: 5 }, { x: 8, y: 5 }, "hex")).toBe(3);
    });
  });

  describe("crawlTiles", () => {
    it("crawls only valid tiles", () => {
      createTestWorld();
      const store = useDataBucket();
      const tiles = store.getTiles();
      const startTile = tiles[Tile.getKey(1, 1)];

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

      expect(valid.size).toBe(0);
    });
  });
});
