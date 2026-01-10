/**
 * Tests for useMoveCostCache.
 * Rules:
 * - 0 Mocking: Use real objects (UnitDesign, etc.) and real store initialization.
 * - Test all if-else-for combinations in the cache logic.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { initTestPinia, loadStaticData } from "../_setup/pinia";
import { useMoveCostCache } from "@/Common/composables/useMoveCostCache";
import { createTestDesign } from "../../_setup/gameHelpers";
import type { TypeKey } from "@/Common/Objects/Common";
import type { TurnEnd } from "@/Simulation/Movement/UnitMovement";
import type { GameKey } from "@/Common/Models/_GameModel";

describe("useMoveCostCache", () => {
  const { cache, getCacheKey, getMoveCost, resetCache, setMoveCost } = useMoveCostCache();

  beforeEach(async () => {
    initTestPinia();
    loadStaticData();
    resetCache();
  });

  const TILE_A = "tile:0,0" as GameKey;
  const TILE_B = "tile:1,1" as GameKey;
  const TILE_C = "tile:2,2" as GameKey;

  describe("getCacheKey", () => {
    it("should generate a base key from platform and equipment", () => {
      const design = createTestDesign("land", "infantry");
      expect(getCacheKey(design, new Set())).toBe("platformType:land,equipmentType:infantry");
    });

    it("should filter out irrelevant special keys", () => {
      const design = createTestDesign("land", "infantry");
      const specials = new Set(["specialType:canEmbark", "specialType:other"] as TypeKey[]);
      expect(getCacheKey(design, specials)).toBe(
        "platformType:land,equipmentType:infantry,specialType:canEmbark",
      );
    });

    it("should maintain deterministic ordering regardless of insertion order", () => {
      const design = createTestDesign("land", "infantry");
      const specials1 = new Set([
        "specialType:canEnterIce",
        "specialType:canEnterMountains",
      ] as TypeKey[]);
      const specials2 = new Set([
        "specialType:canEnterMountains",
        "specialType:canEnterIce",
      ] as TypeKey[]);

      const key1 = getCacheKey(design, specials1);
      const key2 = getCacheKey(design, specials2);

      expect(key1).toBe(key2);
      expect(key1).toBe(
        "platformType:land,equipmentType:infantry,specialType:canEnterIce,specialType:canEnterMountains",
      );
    });

    it("should include all 5 relevant special keys if present in correct order", () => {
      const design = createTestDesign("land", "infantry");
      const specials = new Set([
        "specialType:canEmbark",
        "specialType:canEnterIce",
        "specialType:canEnterMountains",
        "specialType:canEnterOcean",
        "specialType:canEnterSea",
      ] as TypeKey[]);

      expect(getCacheKey(design, specials)).toBe(
        "platformType:land,equipmentType:infantry," +
          "specialType:canEmbark,specialType:canEnterSea,specialType:canEnterOcean," +
          "specialType:canEnterIce,specialType:canEnterMountains",
      );
    });
  });

  describe("setMoveCost & getMoveCost", () => {
    it("should create a new entry tree when the cache key is new", () => {
      const design = createTestDesign();
      const ck = getCacheKey(design, new Set());

      setMoveCost(ck, TILE_A, TILE_B, 1.5);

      expect(getMoveCost(ck, TILE_A, TILE_B)).toBe(1.5);
      expect(cache.has(ck)).toBe(true);
    });

    it("should append a new 'from' tile to an existing cache key", () => {
      const ck = "test-ck";
      setMoveCost(ck, TILE_A, TILE_B, 1.0);
      setMoveCost(ck, TILE_C, TILE_B, 2.0);

      expect(getMoveCost(ck, TILE_A, TILE_B)).toBe(1.0);
      expect(getMoveCost(ck, TILE_C, TILE_B)).toBe(2.0);
    });

    it("should append a new 'to' tile to an existing 'from' tile", () => {
      const ck = "test-ck";
      setMoveCost(ck, TILE_A, TILE_B, 1.0);
      setMoveCost(ck, TILE_A, TILE_C, 3.0);

      expect(getMoveCost(ck, TILE_A, TILE_B)).toBe(1.0);
      expect(getMoveCost(ck, TILE_A, TILE_C)).toBe(3.0);
    });

    it("should overwrite an existing cost for the same path", () => {
      const ck = "test-ck";
      setMoveCost(ck, TILE_A, TILE_B, 1.0);
      setMoveCost(ck, TILE_A, TILE_B, 2.0);

      expect(getMoveCost(ck, TILE_A, TILE_B)).toBe(2.0);
    });

    it("should support number, turnEnd, and null costs", () => {
      const ck = "test-ck";
      setMoveCost(ck, TILE_A, TILE_B, 5.5);
      setMoveCost(ck, TILE_A, TILE_C, "turnEnd" as TurnEnd);
      setMoveCost(ck, TILE_B, TILE_C, null);

      expect(getMoveCost(ck, TILE_A, TILE_B)).toBe(5.5);
      expect(getMoveCost(ck, TILE_A, TILE_C)).toBe("turnEnd");
      expect(getMoveCost(ck, TILE_B, TILE_C)).toBe(null);
    });

    it("should return undefined for cache misses at any level", () => {
      const ck = "test-ck";
      setMoveCost(ck, TILE_A, TILE_B, 1.0);

      expect(getMoveCost("wrong-ck", TILE_A, TILE_B)).toBe(undefined);
      expect(getMoveCost(ck, "wrong-from" as GameKey, TILE_B)).toBe(undefined);
      expect(getMoveCost(ck, TILE_A, "wrong-to" as GameKey)).toBe(undefined);
    });
  });

  describe("resetCache", () => {
    it("should clear the entire cache when no keys are provided", () => {
      setMoveCost("ck1", TILE_A, TILE_B, 1.0);
      setMoveCost("ck2", TILE_B, TILE_C, 2.0);

      expect(cache.size).toBe(2);
      resetCache();
      expect(cache.size).toBe(0);
    });

    it("should remove all entries where a specific tile is the 'from' source", () => {
      setMoveCost("ck1", TILE_A, TILE_B, 1.0);
      setMoveCost("ck1", TILE_C, TILE_B, 2.0);

      resetCache([TILE_A]);

      expect(getMoveCost("ck1", TILE_A, TILE_B)).toBe(undefined);
      expect(getMoveCost("ck1", TILE_C, TILE_B)).toBe(2.0);
    });

    it("should remove all entries where a specific tile is the 'to' destination", () => {
      setMoveCost("ck1", TILE_A, TILE_B, 1.0);
      setMoveCost("ck1", TILE_A, TILE_C, 2.0);

      resetCache([TILE_B]);

      expect(getMoveCost("ck1", TILE_A, TILE_B)).toBe(undefined);
      expect(getMoveCost("ck1", TILE_A, TILE_C)).toBe(2.0);
    });

    it("should remove the tile from all designs (cache keys)", () => {
      setMoveCost("ck1", TILE_A, TILE_B, 1.0);
      setMoveCost("ck2", TILE_A, TILE_B, 2.0);

      resetCache([TILE_A]);

      expect(getMoveCost("ck1", TILE_A, TILE_B)).toBe(undefined);
      expect(getMoveCost("ck2", TILE_A, TILE_B)).toBe(undefined);
    });

    it("should handle multiple tile keys in a single call", () => {
      setMoveCost("ck1", TILE_A, TILE_C, 1.0);
      setMoveCost("ck1", TILE_B, TILE_C, 2.0);

      resetCache([TILE_A, TILE_B]);

      expect(getMoveCost("ck1", TILE_A, TILE_C)).toBe(undefined);
      expect(getMoveCost("ck1", TILE_B, TILE_C)).toBe(undefined);
    });

    it("should do nothing if the tile key does not exist", () => {
      setMoveCost("ck1", TILE_A, TILE_B, 1.0);
      const initialSize = cache.size;

      resetCache(["non-existent" as GameKey]);

      expect(cache.size).toBe(initialSize);
      expect(getMoveCost("ck1", TILE_A, TILE_B)).toBe(1.0);
    });
  });
});
