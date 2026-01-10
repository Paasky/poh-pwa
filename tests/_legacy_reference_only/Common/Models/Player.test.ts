import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cityRawData,
  initTestDataBucket,
  playerRawData,
  tileRawData,
} from "../../../_setup/dataHelpers";
import { tileKey } from "@/Common/Helpers/mapTools";
import { destroyDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { Player } from "@/Common/Models/Player";
import { Religion } from "@/Common/Models/Religion";
import { generateKey } from "@/Common/Models/_GameTypes";
import {
  expectRelationToThrowMissing,
  testManyToManyRelation,
  testManyToOneRelation,
  testOneToOneRelation,
} from "../../../_setup/testHelpers";
import { Culture } from "@/Common/Models/Culture";

describe("Player", () => {
  beforeEach(async () => {
    await initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("constructor and optional relations work", () => {
    const playerKey1 = generateKey("player");
    const playerKey2 = generateKey("player");
    const religionKey = "religion:1";

    useDataBucket().setRawObjects([
      ...playerRawData(playerKey1, {
        name: "Player 1",
        isMinor: false,
        isCurrent: true,
        cultureKey: "culture:1" as any,
      }),
      ...playerRawData(playerKey2, {
        name: "Player 2",
        isMinor: true,
        isCurrent: false,
        religionKey,
        cultureKey: "culture:2" as any,
      }),
      ...tileRawData(tileKey(0, 0)),
      ...cityRawData("city:1", { playerKey: playerKey1, tileKey: tileKey(0, 0) }),
      { key: religionKey, cityKey: "city:1", name: "Test", foundedTurn: 1 } as any,
    ]);

    const player1 = useDataBucket().getObject<Player>(playerKey1);
    const player2 = useDataBucket().getObject<Player>(playerKey2);

    expect(player1.name).toBe("Actor 1");
    expect(player1.isMinor).toBe(false);
    expect(player1.isCurrent).toBe(true);
    testOneToOneRelation(
      player1,
      "culture",
      useDataBucket().getObject<Culture>(player1.cultureKey),
      "player",
    );
    expect(player1.religionKey).toBeNull();

    expect(player2.name).toBe("Actor 2");
    expect(player2.isMinor).toBe(true);
    expect(player2.isCurrent).toBe(false);
    testOneToOneRelation(
      player2,
      "culture",
      useDataBucket().getObject<Culture>(player2.cultureKey),
      "player",
    );
    testManyToOneRelation(
      player2,
      "religion",
      useDataBucket().getObject<Religion>(religionKey),
      "players",
    );

    // Test knownReligionKeys (ManyToMany)
    useDataBucket().setRawObjects([{ key: playerKey1, knownReligionKeys: [religionKey] } as any]);
    const religion = useDataBucket().getObject<Religion>(religionKey);
    testManyToManyRelation(player1, "knownReligions", religion, "knownByPlayers");
  });

  it("throws correct message for invalid relations", () => {
    const playerKey = generateKey("player");

    // Culture missing
    const playerCultureMissing = new Player(playerKey, "culture:99", "Test");
    useDataBucket().setObject(playerCultureMissing);
    expectRelationToThrowMissing(playerCultureMissing, "culture", "culture:99");

    // Religion missing (when provided)
    const playerReligionMissing = new Player(
      playerKey,
      "culture:1",
      "Test",
      false,
      false,
      "religion:99",
    );
    useDataBucket().setObject(playerReligionMissing);
    expectRelationToThrowMissing(playerReligionMissing, "religion", "religion:99");
  });

  // todo: Test yield mods, yields, and startTurn/endTurn logic.
});
