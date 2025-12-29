import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initTestDataBucket, playerRawData, tileRawData } from "../../_setup/dataHelpers";
import { destroyDataBucket, useDataBucket } from "../../../src/Data/useDataBucket";
import { Tile } from "../../../src/Common/Models/Tile";
import { generateKey } from "../../../src/Common/Models/_GameModel";
import { expectRelationToThrowMissing } from "../../_setup/testHelpers";

describe("Tile", () => {
  beforeEach(() => {
    initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("constructor and optional relations work", () => {
    const tileKey1 = generateKey("tile");
    const tileKey2 = generateKey("tile");
    const playerKey = "player:1";

    useDataBucket().setRawObjects([
      ...playerRawData(playerKey),
      ...tileRawData(tileKey1, {
        x: 0,
        y: 0,
        domain: "domainType:land" as any,
        area: "continentType:europe" as any,
        climate: "climateType:temperate" as any,
        terrain: "terrainType:grass" as any,
        elevation: "elevationType:flat" as any,
        feature: "featureType:forest" as any,
      }),
      ...tileRawData(tileKey2, {
        x: 1,
        y: 1,
        domain: "domainType:water" as any,
        area: "continentType:america" as any,
        climate: "climateType:cold" as any,
        terrain: "terrainType:plains" as any,
        elevation: "elevationType:hill" as any,
        playerKey,
        resource: "resourceType:wheat" as any,
        naturalWonder: "naturalWonderType:eyeOfSahara" as any,
      }),
    ]);

    const tile1 = useDataBucket().getObject<Tile>(tileKey1);
    const tile2 = useDataBucket().getObject<Tile>(tileKey2);

    expect(tile1.x).toBe(0);
    expect(tile1.y).toBe(0);
    expect(tile1.domain.key).toBe("domainType:land");
    expect(tile1.area.key).toBe("continentType:europe");
    expect(tile1.climate.key).toBe("climateType:temperate");
    expect(tile1.terrain.key).toBe("terrainType:grass");
    expect(tile1.elevation.key).toBe("elevationType:flat");
    expect(tile1.feature?.key).toBe("featureType:forest");
    expect(tile1.resource).toBeNull();
    expect(tile1.playerKey).toBeNull();
    expect(tile1.player).toBeNull();

    expect(tile2.x).toBe(1);
    expect(tile2.y).toBe(1);
    expect(tile2.domain.key).toBe("domainType:water");
    expect(tile2.area.key).toBe("continentType:america");
    expect(tile2.climate.key).toBe("climateType:cold");
    expect(tile2.terrain.key).toBe("terrainType:plains");
    expect(tile2.elevation.key).toBe("elevationType:hill");
    expect(tile2.resource?.key).toBe("resourceType:wheat");
    expect(tile2.naturalWonder?.key).toBe("naturalWonderType:eyeOfSahara");
    expect(tile2.player).toBe(useDataBucket().getObject(playerKey));
  });

  it("throws correct message for invalid relations and types", () => {
    const tileKey = generateKey("tile");

    // Player missing
    const tilePlayerMissing = new Tile(
      tileKey,
      0,
      0,
      useDataBucket().getType("domainType:land"),
      useDataBucket().getType("continentType:europe"),
      useDataBucket().getType("climateType:temperate"),
      useDataBucket().getType("terrainType:grass"),
      useDataBucket().getType("elevationType:flat"),
      null,
      null,
      null,
      null,
      "player:99",
    );
    useDataBucket().setObject(tilePlayerMissing);
    expectRelationToThrowMissing(tilePlayerMissing, "player", "player:99");

    // Required TypeObject missing in raw
    let error: any;
    try {
      useDataBucket().setRawObjects([
        {
          key: generateKey("tile"),
          x: 0,
          y: 0,
          domain: "invalid",
          area: "continentType:europe",
          climate: "climateType:temperate",
          terrain: "terrainType:grass",
          elevation: "elevationType:flat",
        } as any,
      ]);
    } catch (e) {
      error = e;
    }
    expect(error?.message).toBe("DataBucket.getType(invalid) does not exist!");
  });

  // todo: Test yield calculation and neighbor/A* performance warming.
});
