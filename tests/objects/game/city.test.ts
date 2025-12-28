import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cityRawData,
  initTestDataBucket,
  playerRawData,
  tileRawData,
} from "../../_setup/dataHelpers";
import { destroyDataBucket, useDataBucket } from "../../../src/Store/useDataBucket";
import { City } from "../../../src/objects/game/City";
import { generateKey } from "../../../src/objects/game/_GameObject";
import {
  expectRelationToThrowMissing,
  testManyToOneRelation,
  testOneToOneRelation,
} from "../../_setup/testHelpers";
import { Player } from "../../../src/objects/game/Player";
import { Tile } from "../../../src/objects/game/Tile";

describe("City", () => {
  beforeEach(() => {
    initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("constructor and relations work", () => {
    const cityKey1 = generateKey("city");
    const cityKey2 = generateKey("city");
    const playerKey1 = "player:1";
    const playerKey2 = "player:2";
    const tileKey1 = "tile:0:0";
    const tileKey2 = "tile:1:1";

    useDataBucket().setRawObjects([
      ...playerRawData(playerKey1),
      ...playerRawData(playerKey2),
      ...tileRawData(tileKey1),
      ...tileRawData(tileKey2),
      ...cityRawData(cityKey1, {
        playerKey: playerKey1,
        tileKey: tileKey1,
        name: "City 1",
        health: 100,
        isCapital: true,
      }),
      ...cityRawData(cityKey2, {
        playerKey: playerKey2,
        tileKey: tileKey2,
        name: "City 2",
        health: 50,
        isCapital: false,
        origPlayerKey: playerKey1,
      }),
    ]);

    const city1 = useDataBucket().getObject<City>(cityKey1);
    const city2 = useDataBucket().getObject<City>(cityKey2);

    expect(city1.name).toBe("City 1");
    expect(city1.health).toBe(100);
    expect(city1.isCapital).toBe(true);
    testManyToOneRelation(city1, "player", useDataBucket().getObject<Player>(playerKey1), "cities");
    expect(city1.origPlayer).toBe(useDataBucket().getObject(playerKey1));
    testOneToOneRelation(city1, "tile", useDataBucket().getObject<Tile>(tileKey1), "city");

    expect(city2.name).toBe("City 2");
    expect(city2.health).toBe(50);
    expect(city2.isCapital).toBe(false);
    testManyToOneRelation(city2, "player", useDataBucket().getObject<Player>(playerKey2), "cities");
    expect(city2.origPlayer).toBe(useDataBucket().getObject(playerKey1));
    testOneToOneRelation(city2, "tile", useDataBucket().getObject<Tile>(tileKey2), "city");
  });

  it("throws correct message for invalid relations", () => {
    const cityKey = generateKey("city");

    // Player missing
    const cityPlayerMissing = new City(cityKey, "player:99", "tile:0:0", "Test");
    useDataBucket().setObject(cityPlayerMissing);
    expectRelationToThrowMissing(cityPlayerMissing, "player", "player:99");

    // Tile missing
    const cityTileMissing = new City(cityKey, "player:1", "tile:99", "Test");
    useDataBucket().setObject(cityTileMissing);
    expectRelationToThrowMissing(cityTileMissing, "tile", "tile:99");

    // OrigPlayer missing
    const cityOrigPlayerMissing = new City(
      cityKey,
      "player:1",
      "tile:0:0",
      "Test",
      false,
      100,
      false,
      "player:99",
    );
    useDataBucket().setObject(cityOrigPlayerMissing);
    expectRelationToThrowMissing(cityOrigPlayerMissing, "origPlayer", "player:99");
  });

  // todo: Test yields aggregation, pop growth, and startTurn logic.
});
