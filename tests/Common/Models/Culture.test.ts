import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initTestDataBucket, playerRawData } from "../../_setup/dataHelpers";
import { destroyDataBucket, useDataBucket } from "../../../src/Data/useDataBucket";
import { Culture } from "../../../src/Common/Models/Culture";
import { generateKey } from "../../../src/Common/Models/_GameModel";
import { expectRelationToThrowMissing, testOneToOneRelation } from "../../_setup/testHelpers";
import { Player } from "../../../src/Common/Models/Player";

describe("Culture", () => {
  beforeEach(() => {
    initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("constructor and relations work", () => {
    const cultureKey1 = generateKey("culture");
    const cultureKey2 = generateKey("culture");
    const playerKey1 = "player:1";
    const playerKey2 = "player:2";

    useDataBucket().setRawObjects([
      ...playerRawData(playerKey1, { cultureKey: cultureKey1 }),
      ...playerRawData(playerKey2, { cultureKey: cultureKey2 }),
      {
        key: cultureKey1,
        type: "majorCultureType:mbuti",
        playerKey: playerKey1,
        status: "notSettled",
      } as any,
      {
        key: cultureKey2,
        type: "majorCultureType:bantu",
        playerKey: playerKey2,
        status: "settled",
      } as any,
    ]);

    const culture1 = useDataBucket().getObject<Culture>(cultureKey1);
    const culture2 = useDataBucket().getObject<Culture>(cultureKey2);

    expect(culture1.type.key).toBe("majorCultureType:mbuti");
    expect(culture1.status).toBe("notSettled");
    testOneToOneRelation(
      culture1,
      "player",
      useDataBucket().getObject<Player>(playerKey1),
      "culture",
    );

    expect(culture2.type.key).toBe("majorCultureType:bantu");
    expect(culture2.status).toBe("settled");
    testOneToOneRelation(
      culture2,
      "player",
      useDataBucket().getObject<Player>(playerKey2),
      "culture",
    );
  });

  it("throws correct message for invalid relations", () => {
    const cultureKey = generateKey("culture");

    // Player missing
    const culturePlayerMissing = new Culture(
      cultureKey,
      useDataBucket().getType("majorCultureType:mbuti"),
      "player:99",
    );
    useDataBucket().setObject(culturePlayerMissing);
    expectRelationToThrowMissing(culturePlayerMissing, "player", "player:99");

    // Type resolution fails
    let error: any;
    try {
      useDataBucket().setRawObjects([
        {
          key: generateKey("culture"),
          type: "majorCultureType:invalid",
          playerKey: "player:1",
        } as any,
      ]);
    } catch (e) {
      error = e;
    }
    expect(error?.message).toBe("DataBucket.getType(majorCultureType:invalid) does not exist!");
  });

  // todo: Test evolution, trait/myth selection, and yield bonuses.
});
