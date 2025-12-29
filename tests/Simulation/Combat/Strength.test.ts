import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cityRawData,
  initTestDataBucket,
  playerRawData,
  tileRawData,
  unitDesignRawData,
  unitRawData,
} from "../../_setup/dataHelpers";
import { destroyDataBucket, useDataBucket } from "../../../src/Data/useDataBucket";
import {
  attackStrength,
  calcDamage,
  defenseStrength,
} from "../../../src/Simulation/Combat/Strength";
import { Unit } from "../../../src/Common/Models/Unit";
import { City } from "../../../src/Common/Models/City";
import { tileKey } from "../../../src/helpers/mapTools";

describe("Strength & Combat", () => {
  beforeEach(() => {
    initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("rawDamage signature should match the expected exponential curve", () => {
    // We use calcDamage which calls rawDamage internally
    const check = (a: number, b: number) => calcDamage(a, b).attackerDamage;

    expect(check(10, 10)).toBe(30.0);
    expect(check(11, 10)).toBe(31.3);
    expect(check(20, 10)).toBe(90.0);
    expect(check(100, 10)).toBe(100.0);
    expect(check(9, 10)).toBe(28.2);
    expect(check(5, 10)).toBe(5.8);
    expect(check(5, 50)).toBe(0.0);
    expect(check(13, 5)).toBe(100.0);
    expect(check(7, 5)).toBe(43.2);
    expect(check(8, 10)).toBe(22.9);
  });

  it("Test A: Anti-Cavalry Specialty (Spearman vs Horseman)", () => {
    const bucket = useDataBucket();
    const tileKey1 = tileKey(0, 0);
    const tileKey2 = tileKey(1, 0);

    bucket.setRawObjects([
      ...playerRawData("player:1"),
      ...playerRawData("player:2"),
      ...tileRawData(tileKey1),
      ...tileRawData(tileKey2),
      ...unitDesignRawData("unitDesign:spearman", {
        platform: "platformType:human",
        equipment: "equipmentType:bronzeSpear",
      }),
      ...unitDesignRawData("unitDesign:horseman", {
        platform: "platformType:horse",
        equipment: "equipmentType:axe",
      }),
      ...unitRawData("unit:spearman", {
        designKey: "unitDesign:spearman",
        playerKey: "player:1",
        tileKey: tileKey1,
      }),
      ...unitRawData("unit:horseman", {
        designKey: "unitDesign:horseman",
        playerKey: "player:2",
        tileKey: tileKey2,
      }),
    ]);

    const spearman = bucket.getObject<Unit>("unit:spearman");
    const horseman = bucket.getObject<Unit>("unit:horseman");

    // bronzeSpear has 30% vs platformCategory:mounted
    // horse platform is in platformCategory:mounted
    const aStr = attackStrength(spearman, horseman);
    const bStr = defenseStrength(spearman, horseman);

    // platformType:human strength: 0 (default)
    // equipmentType:bronzeSpear strength: 8 lump, attack: 30% vs platformCategory:mounted
    // Base strength = 0 + 8 = 8
    // Bonus = 8 * 0.3 = 2.4
    // Total = 10.4
    expect(aStr).toBe(10.4);
    expect(bStr).toBe(10.4);
  });

  it("Test B: Anti-Infantry Dominance (Axeman vs Spearman)", () => {
    const bucket = useDataBucket();
    const tKey = tileKey(0, 0);

    bucket.setRawObjects([
      ...playerRawData("player:1"),
      ...playerRawData("player:2"),
      ...tileRawData(tKey),
      ...unitDesignRawData("unitDesign:axeman", {
        platform: "platformType:human",
        equipment: "equipmentType:axe",
      }),
      ...unitDesignRawData("unitDesign:spearman", {
        platform: "platformType:human",
        equipment: "equipmentType:spear",
      }),
      ...unitRawData("unit:axeman", {
        designKey: "unitDesign:axeman",
        playerKey: "player:1",
        tileKey: tKey,
      }),
      ...unitRawData("unit:spearman", {
        designKey: "unitDesign:spearman",
        playerKey: "player:2",
        tileKey: tKey,
      }),
    ]);

    const axeman = bucket.getObject<Unit>("unit:axeman");
    const spearman = bucket.getObject<Unit>("unit:spearman");

    // equipmentType:axe has 30% vs platformType:human
    const aStr = attackStrength(axeman, spearman);

    // platformType:human strength: 0 (default)
    // equipmentType:axe strength: 6 lump, attack: 30% vs platformType:human
    // Base strength = 0 + 6 = 6
    // Bonus = 6 * 0.3 = 1.8
    // Total = 7.8
    expect(aStr).toBe(7.8);
  });

  it("Test C: Naval vs. City (Frigate vs City)", () => {
    const bucket = useDataBucket();
    const tKey = tileKey(0, 0);

    bucket.setRawObjects([
      ...playerRawData("player:1"),
      ...playerRawData("player:2"),
      ...tileRawData(tKey),
      ...unitDesignRawData("unitDesign:frigate", {
        platform: "platformType:heavyGalley",
        equipment: "equipmentType:bombard",
      }),
      ...cityRawData("city:1", {
        playerKey: "player:2",
        tileKey: tKey,
      }),
      ...unitRawData("unit:frigate", {
        designKey: "unitDesign:frigate",
        playerKey: "player:1",
        tileKey: tKey,
      }),
    ]);

    const frigate = bucket.getObject<Unit>("unit:frigate");
    const city = bucket.getObject<City>("city:1");

    // equipmentType:bombard strength: 18 lump, attack: 30% for conceptType:urban
    // platformType:heavyGalley strength: 15% (percent mod)
    // Base strength = 18
    // Galley bonus = 18 * 0.15 = 2.7
    // Urban bonus = 18 * 0.3 = 5.4
    // Total = 18 + 2.7 + 5.4 = 26.1
    const aStr = attackStrength(frigate, city);
    expect(aStr).toBe(26.1);

    // Check vs a unit to see it's different
    bucket.setRawObjects([
      ...unitDesignRawData("unitDesign:target", {
        platform: "platformType:human",
        equipment: "equipmentType:axe",
      }),
      ...unitRawData("unit:target", {
        designKey: "unitDesign:target",
        playerKey: "player:2",
        tileKey: tKey,
      }),
    ]);
    const targetUnit = bucket.getObject<Unit>("unit:target");
    const aStrVsUnit = attackStrength(frigate, targetUnit);

    // Base strength = 18
    // Galley bonus = 18 * 0.15 = 2.7
    // Total = 20.7
    expect(aStrVsUnit).toBe(20.7);
  });

  it("Test E: City Defense Growth (Inheritance)", () => {
    const bucket = useDataBucket();
    const hillTileKey = tileKey(1, 1);
    const flatTileKey = tileKey(0, 0);

    bucket.setRawObjects([
      ...playerRawData("player:1"),
      ...tileRawData(flatTileKey, { x: 0, y: 0, elevation: "elevationType:flat" }),
      ...tileRawData(hillTileKey, { x: 1, y: 1, elevation: "elevationType:hill" }),
      ...cityRawData("city:flat", { playerKey: "player:1", tileKey: flatTileKey }),
      ...cityRawData("city:hill", { playerKey: "player:1", tileKey: hillTileKey }),
    ]);

    const cityFlat = bucket.getObject<City>("city:flat");
    const cityHill = bucket.getObject<City>("city:hill");

    // staticData.json has no yieldType:strength for conceptType:city or elevationType:hill
    // So both should have 0 strength.

    // attacker doesn't matter much here, but we need one for defenseStrength
    bucket.setRawObjects([
      ...unitDesignRawData("unitDesign:attacker"),
      ...unitRawData("unit:attacker", { playerKey: "player:2", tileKey: flatTileKey }),
    ]);
    const attacker = bucket.getObject<Unit>("unit:attacker");

    const dStrFlat = defenseStrength(attacker, cityFlat);
    const dStrHill = defenseStrength(attacker, cityHill);

    // Both should be 0 because city and hill have no strength yield in staticData.json
    expect(dStrHill).toBe(0.0);
    expect(dStrFlat).toBe(0.0);
  });
});
