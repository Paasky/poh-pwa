import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cityRawData,
  initTestDataBucket,
  playerRawData,
  religionRawData,
  tileRawData,
} from "../../../_setup/dataHelpers";
import { tileKey } from "@/Common/Helpers/mapTools";
import { destroyDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { Religion } from "@/Common/Models/Religion";
import { generateKey } from "@/Common/Models/_GameTypes";
import {
  expectRelationToThrowMissing,
  testManyToManyRelation,
  testManyToOneRelation,
} from "../../../_setup/testHelpers";
import { City } from "@/Common/Models/City";
import { Player } from "@/Common/Models/Player";

describe("Religion", () => {
  beforeEach(async () => {
    await initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("constructor and relations work", () => {
    const religionKey1 = generateKey("religion");
    const religionKey2 = generateKey("religion");
    const cityKey1 = "city:1";
    const cityKey2 = "city:2";
    const playerKey = "player:1";
    const tileKey1 = tileKey(0, 0);
    const tileKey2 = tileKey(1, 1);

    useDataBucket().setRawObjects([
      ...playerRawData(playerKey),
      ...tileRawData(tileKey1),
      ...tileRawData(tileKey2),
      ...cityRawData(cityKey1, { playerKey, tileKey: tileKey1 }),
      ...cityRawData(cityKey2, { playerKey, tileKey: tileKey2 }),
      ...religionRawData(religionKey1, {
        cityKey: cityKey1,
        name: "Religion 1",
        foundedTurn: 1,
        status: "myths",
        myths: ["mythType:godMother"] as any,
      }),
      ...religionRawData(religionKey2, {
        cityKey: cityKey2,
        name: "Religion 2",
        foundedTurn: 50,
        status: "gods",
        gods: ["godType:skyGod"] as any,
        dogmas: ["dogmaType:reincarnation"] as any,
      }),
    ]);

    const religion1 = useDataBucket().getObject<Religion>(religionKey1);
    const religion2 = useDataBucket().getObject<Religion>(religionKey2);

    expect(religion1.name).toBe("Religion 1");
    expect(religion1.foundedTurn).toBe(1);
    expect(religion1.status).toBe("myths");
    expect(religion1.myths[0].key).toBe("mythType:godMother");
    testManyToOneRelation(
      religion1,
      "city",
      useDataBucket().getObject<City>(cityKey1),
      "holyCityFors",
    );

    expect(religion2.name).toBe("Religion 2");
    expect(religion2.foundedTurn).toBe(50);
    expect(religion2.status).toBe("gods");
    expect(religion2.gods[0].key).toBe("godType:skyGod");
    expect(religion2.dogmas[0].key).toBe("dogmaType:reincarnation");
    testManyToOneRelation(
      religion2,
      "city",
      useDataBucket().getObject<City>(cityKey2),
      "holyCityFors",
    );

    // Test knownByPlayerKeys (ManyToMany)
    useDataBucket().setRawObjects([{ key: religionKey1, knownByPlayerKeys: [playerKey] } as any]);
    testManyToManyRelation(
      religion1,
      "knownByPlayers",
      useDataBucket().getObject<Player>(playerKey),
      "knownReligions",
    );
  });

  it("throws correct message for invalid relations", () => {
    // City missing
    const religionKey = generateKey("religion");
    const religionCityMissing = new Religion(religionKey, "Test", "city:99", 1);
    useDataBucket().setObject(religionCityMissing);
    expectRelationToThrowMissing(religionCityMissing, "city", "city:99");

    // Required attribute foundedTurn missing in raw
    let error: any;
    const missingFoundedTurnKey = generateKey("religion");
    try {
      useDataBucket().setRawObjects([
        { key: missingFoundedTurnKey, name: "Test", cityKey: "city:1" } as any,
      ]);
    } catch (e) {
      error = e;
    }
    expect(error?.message).toBe(
      `Required attribute 'foundedTurn' missing from {"key":"${missingFoundedTurnKey}","name":"Test","cityKey":"city:1"}`,
    );
  });

  // todo: Test evolution, trait/myth selection, and yield bonuses.
});
