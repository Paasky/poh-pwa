import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initTestDataBucket, riverRawData, tileRawData } from "../../_setup/dataHelpers";
import { destroyDataBucket, useDataBucket } from "../../../src/Store/useDataBucket";
import { River } from "../../../src/objects/game/River";
import { Tile } from "../../../src/objects/game/Tile";
import { generateKey } from "../../../src/objects/game/_GameObject";
import { expectRelationToThrowMissing, testOneToManyRelation } from "../../_setup/testHelpers";

describe("River", () => {
  beforeEach(() => {
    initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("constructor and relations work", () => {
    const riverKey1 = generateKey("river");
    const riverKey2 = generateKey("river");
    const tileKey1 = "tile:0:0";
    const tileKey2 = "tile:1:1";

    useDataBucket().setRawObjects([
      ...tileRawData(tileKey1),
      ...tileRawData(tileKey2),
      ...riverRawData(riverKey1, { name: "River 1", tileKeys: [tileKey1] }),
      ...riverRawData(riverKey2, { name: "River 2", tileKeys: [tileKey2] }),
    ]);

    const river1 = useDataBucket().getObject<River>(riverKey1);
    const river2 = useDataBucket().getObject<River>(riverKey2);
    const tile1 = useDataBucket().getObject<Tile>(tileKey1);
    const tile2 = useDataBucket().getObject<Tile>(tileKey2);

    expect(river1.name).toBe("River 1");
    testOneToManyRelation(river1, "tiles", tile1, "river");

    expect(river2.name).toBe("River 2");
    testOneToManyRelation(river2, "tiles", tile2, "river");
  });

  it("throws correct message for invalid relations", () => {
    const riverKey = generateKey("river");

    // Tile missing in tileKeys
    const riverTileMissing = new River(riverKey, "Test", ["tile:99"]);
    useDataBucket().setObject(riverTileMissing);
    expectRelationToThrowMissing(riverTileMissing, "tiles", "tile:99");

    // Empty tileKeys
    expect(() => {
      useDataBucket().setRawObjects([{ key: riverKey, name: "Test", tileKeys: [] } as any]);
    }).not.toThrow(); // Empty array is allowed by GameDataLoader, but hasMany might fail on access if not handled
  });

  // todo: Test route deletion and yields.
});
