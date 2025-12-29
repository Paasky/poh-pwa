import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cityRawData,
  constructionRawData,
  initTestDataBucket,
  playerRawData,
  tileRawData,
} from "../../_setup/dataHelpers";
import { tileKey } from "../../../src/helpers/mapTools";
import { destroyDataBucket, useDataBucket } from "../../../src/Data/useDataBucket";
import { Construction } from "../../../src/Common/Models/Construction";
import { generateKey } from "../../../src/Common/Models/_GameTypes";
import {
  expectRelationToThrowMissing,
  testManyToOneRelation,
  testOneToOneRelation,
} from "../../_setup/testHelpers";
import { Tile } from "../../../src/Common/Models/Tile";
import { City } from "../../../src/Common/Models/City";

describe("Construction", () => {
  beforeEach(() => {
    initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("constructor and relations work", () => {
    const constructionKey1 = generateKey("construction");
    const constructionKey2 = generateKey("construction");
    const tileKey1 = tileKey(0, 0);
    const tileKey2 = tileKey(1, 1);
    const cityKey = "city:1";

    useDataBucket().setRawObjects([
      ...playerRawData("player:1"),
      ...tileRawData(tileKey1),
      ...tileRawData(tileKey2),
      ...cityRawData(cityKey, { tileKey: tileKey1 }),
      ...constructionRawData(constructionKey1, {
        tileKey: tileKey1,
        type: "buildingType:stoneWorks" as any,
        health: 100,
        progress: 0,
        cityKey: null,
      }),
      ...constructionRawData(constructionKey2, {
        tileKey: tileKey2,
        cityKey,
        type: "buildingType:smith" as any,
        health: 50,
        progress: 100,
      }),
    ]);

    const construction1 = useDataBucket().getObject<Construction>(constructionKey1);
    const construction2 = useDataBucket().getObject<Construction>(constructionKey2);

    expect(construction1.type.key).toBe("buildingType:stoneWorks");
    expect(construction1.health).toBe(100);
    expect(construction1.progress).toBe(0);
    testOneToOneRelation(
      construction1,
      "tile",
      useDataBucket().getObject<Tile>(tileKey1),
      "construction",
    );
    expect(construction1.cityKey).toBeNull();

    expect(construction2.type.key).toBe("buildingType:smith");
    expect(construction2.health).toBe(50);
    expect(construction2.progress).toBe(100);
    testOneToOneRelation(
      construction2,
      "tile",
      useDataBucket().getObject<Tile>(tileKey2),
      "construction",
    );
    testManyToOneRelation(
      construction2,
      "city",
      useDataBucket().getObject<City>(cityKey),
      "constructions",
    );
  });

  it("throws correct message for invalid relations", () => {
    const constructionKey = generateKey("construction");
    const type = useDataBucket().getType("buildingType:stoneWorks");

    // Tile missing
    const constructionTileMissing = new Construction(constructionKey, type, "tile:99");
    useDataBucket().setObject(constructionTileMissing);
    expectRelationToThrowMissing(constructionTileMissing, "tile", "tile:99");

    // City missing (when provided)
    const constructionCityMissing = new Construction(
      constructionKey,
      type,
      tileKey(0, 0),
      "city:99",
    );
    useDataBucket().setObject(constructionCityMissing);
    expectRelationToThrowMissing(constructionCityMissing, "city", "city:99");
  });

  // todo: Test progress/health yields and abandonment/completion.
});
