import { describe, expect, it } from "vitest";
import { rng } from "@/Common/Helpers/Rng";
import { initTestDataBucket } from "./_setup/dataHelpers";
import { createTestWorld } from "./_setup/testWorld";
import { useDataBucket } from "@/Data/useDataBucket";
import { tileKey } from "@/Common/Helpers/mapTools";
import type { Tile } from "@/Common/Models/Tile";

// The purpose of this test is to sanity-check all test scaffolding required by this project.

describe("Scaffolding", () => {
  it("Verify rng() mock & determinism", () => {
    rng.seed("scaffolding");
    const val1 = rng.next();
    const val2 = rng.next();

    rng.seed("scaffolding");
    expect(rng.next()).toBe(val1);
    expect(rng.next()).toBe(val2);

    const cleanup = rng.mock([0.123]);
    expect(rng.next()).toBe(0.123);
    cleanup();
    expect(rng.next()).not.toBe(0.123);
  });

  it("Verify Data Bucket", async () => {
    await initTestDataBucket();
    const bucket = useDataBucket();

    const taigaCategory = bucket.getCategory("regionCategory:taiga");
    expect(taigaCategory).toBeDefined();
    expect(taigaCategory.key).toBe("regionCategory:taiga");
    expect(taigaCategory.class).toBe("regionCategory");

    const scandinaviaType = bucket.getType("regionType:scandinavia");
    expect(scandinaviaType).toBeDefined();
    expect(scandinaviaType.key).toBe("regionType:scandinavia");
    expect(scandinaviaType.class).toBe("regionType");
    expect(scandinaviaType.category).toBe("regionCategory:taiga");
  });

  it("Verify Test World", async () => {
    await initTestDataBucket();
    createTestWorld();
    const bucket = useDataBucket();

    const tiles = bucket.getClassObjects<Tile>("tile");
    expect(tiles.size).toBe(150); // 15 × 10

    const oceanTile = bucket.getObject<Tile>(tileKey(0, 0));
    expect(oceanTile.terrain.key).toBe("terrainType:ocean");
    expect(oceanTile.domain.key).toBe("domainType:water");

    const grassTile = bucket.getObject<Tile>(tileKey(2, 2));
    expect(grassTile.terrain.key).toBe("terrainType:grass");
    expect(grassTile.domain.key).toBe("domainType:land");

    const majorRiverTile = bucket.getObject<Tile>(tileKey(12, 2));
    expect(majorRiverTile.terrain.key).toBe("terrainType:majorRiver");
  });
});
