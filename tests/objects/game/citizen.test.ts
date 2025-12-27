import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  citizenRawData,
  cityRawData,
  initTestDataBucket,
  playerRawData,
  tileRawData,
} from "../../_setup/dataHelpers";
import { destroyDataBucket, useDataBucket } from "../../../src/Store/useDataBucket";
import { Citizen } from "../../../src/objects/game/Citizen";
import { generateKey } from "../../../src/objects/game/_GameObject";
import { expectRelationToThrowMissing, testManyToOneRelation } from "../../_setup/testHelpers";
import { Religion } from "../../../src/objects/game/Religion";
import { Tile } from "../../../src/objects/game/Tile";
import { Player } from "../../../src/objects/game/Player";
import { Culture } from "../../../src/objects/game/Culture";
import { City } from "../../../src/objects/game/City";

describe("Citizen", () => {
  beforeEach(() => {
    initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("constructor and relations work", () => {
    const citizenKey1 = generateKey("citizen");
    const citizenKey2 = generateKey("citizen");
    const cityKey1 = "city:1";
    const cityKey2 = "city:2";
    const playerKey1 = "player:1";
    const playerKey2 = "player:2";
    const cultureKey1 = "culture:1";
    const cultureKey2 = "culture:2";
    const tileKey1 = "tile:0:0";
    const tileKey2 = "tile:1:1";
    const religionKey = "religion:1";

    useDataBucket().setRawObjects([
      ...playerRawData(playerKey1, { cultureKey: cultureKey1 }),
      ...playerRawData(playerKey2, { cultureKey: cultureKey2 }),
      ...tileRawData(tileKey1),
      ...tileRawData(tileKey2),
      ...cityRawData(cityKey1, { playerKey: playerKey1, tileKey: tileKey1 }),
      ...cityRawData(cityKey2, { playerKey: playerKey2, tileKey: tileKey2 }),
      ...citizenRawData(citizenKey1, {
        cityKey: cityKey1,
        cultureKey: cultureKey1,
        playerKey: playerKey1,
        tileKey: tileKey1,
        policy: "policyType:republic" as any,
      }),
      ...citizenRawData(citizenKey2, {
        cityKey: cityKey2,
        cultureKey: cultureKey2,
        playerKey: playerKey2,
        tileKey: tileKey2,
        religionKey,
        policy: "policyType:oligarchy" as any,
      }),
      { key: religionKey, cityKey: cityKey1, name: "Test", foundedTurn: 1 } as any,
    ]);

    const citizen1 = useDataBucket().getObject<Citizen>(citizenKey1);
    const citizen2 = useDataBucket().getObject<Citizen>(citizenKey2);

    testManyToOneRelation(citizen1, "city", useDataBucket().getObject<City>(cityKey1), "citizens");
    testManyToOneRelation(
      citizen1,
      "culture",
      useDataBucket().getObject<Culture>(cultureKey1),
      "citizens",
    );
    testManyToOneRelation(
      citizen1,
      "player",
      useDataBucket().getObject<Player>(playerKey1),
      "citizens",
    );
    testManyToOneRelation(citizen1, "tile", useDataBucket().getObject<Tile>(tileKey1), "citizens");
    expect(citizen1.religionKey).toBeNull();
    expect(citizen1.policy?.key).toBe("policyType:republic");

    testManyToOneRelation(citizen2, "city", useDataBucket().getObject<City>(cityKey2), "citizens");
    testManyToOneRelation(
      citizen2,
      "culture",
      useDataBucket().getObject<Culture>(cultureKey2),
      "citizens",
    );
    testManyToOneRelation(
      citizen2,
      "player",
      useDataBucket().getObject<Player>(playerKey2),
      "citizens",
    );
    testManyToOneRelation(citizen2, "tile", useDataBucket().getObject<Tile>(tileKey2), "citizens");
    testManyToOneRelation(
      citizen2,
      "religion",
      useDataBucket().getObject<Religion>(religionKey),
      "citizens",
    );
    expect(citizen2.policy?.key).toBe("policyType:oligarchy");
  });

  it("throws correct message for invalid relations", () => {
    const citizenKey = generateKey("citizen");

    // City missing
    const citizenCityMissing = new Citizen(
      citizenKey,
      "city:99",
      "culture:1",
      "player:1",
      "tile:0:0",
    );
    useDataBucket().setObject(citizenCityMissing);
    expectRelationToThrowMissing(citizenCityMissing, "city", "city:99");

    // Culture missing
    const citizenCultureMissing = new Citizen(
      citizenKey,
      "city:1",
      "culture:99",
      "player:1",
      "tile:0:0",
    );
    useDataBucket().setObject(citizenCultureMissing);
    expectRelationToThrowMissing(citizenCultureMissing, "culture", "culture:99");

    // Player missing
    const citizenPlayerMissing = new Citizen(
      citizenKey,
      "city:1",
      "culture:1",
      "player:99",
      "tile:0:0",
    );
    useDataBucket().setObject(citizenPlayerMissing);
    expectRelationToThrowMissing(citizenPlayerMissing, "player", "player:99");

    // Tile missing
    const citizenTileMissing = new Citizen(
      citizenKey,
      "city:1",
      "culture:1",
      "player:1",
      "tile:99",
    );
    useDataBucket().setObject(citizenTileMissing);
    expectRelationToThrowMissing(citizenTileMissing, "tile", "tile:99");

    // Policy TypeObject missing
    let error: any;
    try {
      useDataBucket().setRawObjects([
        {
          key: generateKey("citizen"),
          cityKey: "city:1",
          cultureKey: "culture:1",
          playerKey: "player:1",
          tileKey: "tile:0:0",
          policy: "invalid",
        } as any,
      ]);
    } catch (e) {
      error = e;
    }
    expect(error?.message).toBe("DataBucket.getType(invalid) does not exist!");
  });

  // todo: Test migrate(), pickTile(), and yields calculation.
});
