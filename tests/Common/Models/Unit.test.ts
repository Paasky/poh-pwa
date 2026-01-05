import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cityRawData,
  initTestDataBucket,
  playerRawData,
  tileRawData,
  unitDesignRawData,
  unitRawData,
} from "../../_setup/dataHelpers";
import { tileKey } from "../../../src/helpers/mapTools";
import { destroyDataBucket, useDataBucket } from "../../../src/Data/useDataBucket";
import { Unit } from "../../../src/Common/Models/Unit";
import { generateKey } from "../../../src/Common/Models/_GameTypes";
import { expectRelationToThrowMissing, testManyToOneRelation } from "../../_setup/testHelpers";
import { Tile } from "../../../src/Common/Models/Tile";
import { City } from "../../../src/Common/Models/City";
import { UnitDesign } from "../../../src/Common/Models/UnitDesign";
import { Player } from "../../../src/Common/Models/Player";

describe("Unit", () => {
  beforeEach(() => {
    initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("constructor and relations work", () => {
    const unitKey1 = generateKey("unit");
    const unitKey2 = generateKey("unit");
    const designKey = "unitDesign:1";
    const playerKey = "player:1";
    const tileKey1 = tileKey(0, 0);
    const tileKey2 = tileKey(1, 1);
    const cityKey = "city:1";

    useDataBucket().setRawObjects([
      ...playerRawData(playerKey),
      ...tileRawData(tileKey1),
      ...tileRawData(tileKey2),
      ...cityRawData(cityKey, { playerKey, tileKey: tileKey1 }),
      ...unitDesignRawData(designKey, { playerKey }),
      ...unitRawData(unitKey1, {
        designKey,
        playerKey,
        tileKey: tileKey1,
        customName: "Unit 1",
        health: 100,
        moves: 2,
      } as any),
      ...unitRawData(unitKey2, {
        designKey,
        playerKey,
        tileKey: tileKey2,
        cityKey,
        customName: "Unit 2",
        health: 50,
        moves: 0,
        action: "actionType:move",
      } as any),
    ]);

    const unit1 = useDataBucket().getObject<Unit>(unitKey1);
    const unit2 = useDataBucket().getObject<Unit>(unitKey2);

    expect(unit1.customName).toBe("Unit 1");
    expect(unit1.health).toBe(100);
    expect(unit1.movement.moves).toBe(2);
    testManyToOneRelation(
      unit1,
      "design",
      useDataBucket().getObject<UnitDesign>(designKey),
      "units",
    );
    testManyToOneRelation(unit1, "player", useDataBucket().getObject<Player>(playerKey), "units");
    testManyToOneRelation(unit1, "tile", useDataBucket().getObject<Tile>(tileKey1), "units");
    expect(unit1.cityKey).toBeNull();

    expect(unit2.customName).toBe("Unit 2");
    expect(unit2.health).toBe(50);
    expect(unit2.movement.moves).toBe(0);
    expect(unit2.action?.key).toBe("actionType:move");
    testManyToOneRelation(
      unit2,
      "design",
      useDataBucket().getObject<UnitDesign>(designKey),
      "units",
    );
    testManyToOneRelation(unit2, "player", useDataBucket().getObject<Player>(playerKey), "units");
    testManyToOneRelation(unit2, "tile", useDataBucket().getObject<Tile>(tileKey2), "units");
    testManyToOneRelation(unit2, "city", useDataBucket().getObject<City>(cityKey), "units");
  });

  it("throws correct message for invalid relations", () => {
    const unitKey = generateKey("unit");

    // Actor missing
    const unitPlayerMissing = new Unit(unitKey, "unitDesign:1", "player:99", tileKey(0, 0));
    useDataBucket().setObject(unitPlayerMissing);
    expectRelationToThrowMissing(unitPlayerMissing, "player", "player:99");

    // Tile missing
    const unitTileMissing = new Unit(unitKey, "unitDesign:1", "player:1", "tile:99");
    useDataBucket().setObject(unitTileMissing);
    expectRelationToThrowMissing(unitTileMissing, "tile", "tile:99");

    // Design missing
    const unitDesignMissing = new Unit(unitKey, "unitDesign:99", "player:1", tileKey(0, 0));
    useDataBucket().setObject(unitDesignMissing);
    expectRelationToThrowMissing(unitDesignMissing, "design", "unitDesign:99");

    // City missing (when provided)
    const unitCityMissing = new Unit(unitKey, "unitDesign:1", "player:1", tileKey(0, 0), "city:99");
    useDataBucket().setObject(unitCityMissing);
    expectRelationToThrowMissing(unitCityMissing, "city", "city:99");
  });

  // todo: Test movement, visibility, vision aggregation, and combat/health modifiers.
});
