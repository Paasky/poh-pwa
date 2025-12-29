import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initTestDataBucket, playerRawData, unitDesignRawData } from "../../_setup/dataHelpers";
import { destroyDataBucket, useDataBucket } from "../../../src/Data/useDataBucket";
import { UnitDesign } from "../../../src/Common/Models/UnitDesign";
import { generateKey } from "../../../src/Common/Models/_GameModel";
import { expectRelationToThrowMissing } from "../../_setup/testHelpers";

describe("UnitDesign", () => {
  beforeEach(() => {
    initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("constructor and optional relations work", () => {
    const designKey1 = generateKey("unitDesign");
    const designKey2 = generateKey("unitDesign");
    const playerKey = "player:1";

    useDataBucket().setRawObjects([
      ...playerRawData(playerKey),
      ...unitDesignRawData(designKey1, {
        playerKey: null,
        platform: "platformType:raft" as any,
        equipment: "equipmentType:axe" as any,
        name: "Global Design",
        isElite: false,
        isActive: true,
      }),
      ...unitDesignRawData(designKey2, {
        playerKey,
        platform: "platformType:galley" as any,
        equipment: "equipmentType:bronzeAxe" as any,
        name: "Player Design",
        isElite: true,
        isActive: false,
      }),
    ]);

    const design1 = useDataBucket().getObject<UnitDesign>(designKey1);
    const design2 = useDataBucket().getObject<UnitDesign>(designKey2);

    expect(design1.name).toBe("Global Design");
    expect(design1.platform.key).toBe("platformType:raft");
    expect(design1.equipment.key).toBe("equipmentType:axe");
    expect(design1.isElite).toBe(false);
    expect(design1.isActive).toBe(true);
    expect(design1.playerKey).toBeNull();
    expect(design1.player).toBeNull();

    expect(design2.name).toBe("Player Design");
    expect(design2.platform.key).toBe("platformType:galley");
    expect(design2.equipment.key).toBe("equipmentType:bronzeAxe");
    expect(design2.isElite).toBe(true);
    expect(design2.isActive).toBe(false);
    expect(design2.player).toBe(useDataBucket().getObject(playerKey));
  });

  it("throws correct message for invalid relations and types", () => {
    const designKey = generateKey("unitDesign");

    // Player missing (when provided)
    const designPlayerMissing = new UnitDesign(
      designKey,
      useDataBucket().getType("platformType:raft"),
      useDataBucket().getType("equipmentType:axe"),
      "Test",
      "player:99",
    );
    useDataBucket().setObject(designPlayerMissing);
    expectRelationToThrowMissing(designPlayerMissing, "player", "player:99");

    // Required TypeObject missing in raw
    let error: any;
    try {
      useDataBucket().setRawObjects([
        {
          key: generateKey("unitDesign"),
          platform: "invalid",
          equipment: "equipmentType:axe",
          name: "Test",
          playerKey: "player:1",
        } as any,
      ]);
    } catch (e) {
      error = e;
    }
    expect(error?.message).toBe("DataBucket.getType(invalid) does not exist!");
  });
});
