import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cityRawData,
  initTestDataBucket,
  playerRawData,
  tileRawData,
  unitDesignRawData,
  unitRawData,
} from "../_setup/dataHelpers";
import { tileKey } from "../../src/helpers/mapTools";
import { destroyDataBucket, useDataBucket } from "../../src/Data/useDataBucket";
import { Tile } from "../../src/Common/Models/Tile";
import { City } from "../../src/Common/Models/City";
import { Unit } from "../../src/Common/Models/Unit";

describe("GameDataLoader", () => {
  beforeEach(() => {
    initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("should create objects with only required inputs and init correctly", () => {
    const bucket = useDataBucket();

    // Tile
    bucket.setRawObjects(tileRawData(tileKey(0, 0)));
    const tile = bucket.getObject<Tile>(tileKey(0, 0));
    expect(tile).toBeInstanceOf(Tile);
    expect(tile.x).toBe(0);
    expect(tile.y).toBe(0);
    expect(tile.feature).toBeNull();

    // City (needs a player and a tile)
    bucket.setRawObjects([
      ...playerRawData("player:1"),
      ...cityRawData("city:1", { playerKey: "player:1", tileKey: tileKey(0, 0) }),
    ]);
    const city = bucket.getObject<City>("city:1");
    expect(city).toBeInstanceOf(City);
    expect(city.name).toBe("Test City");
    expect(city.health).toBe(100);
    expect(city.canAttack).toBe(false);

    // Unit (needs a design, player and a tile)
    bucket.setRawObjects([
      ...unitDesignRawData("unitDesign:1"),
      ...unitRawData("unit:1", {
        designKey: "unitDesign:1",
        playerKey: "player:1",
        tileKey: tileKey(0, 0),
      }),
    ]);
    const unit = bucket.getObject<Unit>("unit:1");
    expect(unit).toBeInstanceOf(Unit);
    expect(unit.health).toBe(100);
    expect(unit.movement.moves).toBe(0);
  });

  it("should create objects with all inputs and init correctly", () => {
    const bucket = useDataBucket();

    bucket.setRawObjects([
      ...playerRawData("player:1"),
      ...tileRawData(tileKey(0, 0)),
      ...cityRawData("city:1", {
        playerKey: "player:1",
        tileKey: tileKey(0, 0),
        name: "Capital City",
        canAttack: true,
        health: 50,
        isCapital: true,
        origPlayerKey: "player:1",
      }),
    ]);

    const city = bucket.getObject<City>("city:1");
    expect(city.name).toBe("Capital City");
    expect(city.canAttack).toBe(true);
    expect(city.health).toBe(50);
    expect(city.isCapital).toBe(true);
    expect(city.origPlayerKey).toBe("player:1");
  });

  it("should update single property correctly", () => {
    const bucket = useDataBucket();

    bucket.setRawObjects([
      ...playerRawData("player:1"),
      ...tileRawData(tileKey(0, 0)),
      ...cityRawData("city:1", { health: 100 }),
    ]);

    const city = bucket.getObject<City>("city:1");
    expect(city.health).toBe(100);

    // Update health
    bucket.setRawObjects([{ key: "city:1", health: 50 } as any]);
    expect(city.health).toBe(50);
  });

  it("should add single relation correctly (City -> Player)", () => {
    const bucket = useDataBucket();

    bucket.setRawObjects([...playerRawData("player:1"), ...tileRawData(tileKey(0, 0))]);
    const player = bucket.getObject("player:1") as any;
    expect(player.cityKeys.size).toBe(0);

    bucket.setRawObjects([
      ...cityRawData("city:1", { playerKey: "player:1", tileKey: tileKey(0, 0) }),
    ]);

    expect(player.cityKeys.has("city:1")).toBe(true);
    expect(player.cities).toContain(bucket.getObject("city:1"));
  });

  it("should update single relation correctly (Unit -> Tile)", () => {
    const bucket = useDataBucket();

    bucket.setRawObjects([
      ...playerRawData("player:1"),
      ...tileRawData(tileKey(0, 0)),
      ...tileRawData(tileKey(1, 1), { x: 1, y: 1 }),
      ...unitDesignRawData("unitDesign:1"),
      ...unitRawData("unit:1", { tileKey: tileKey(0, 0) }),
    ]);

    const unit = bucket.getObject<Unit>("unit:1");
    const tile0 = bucket.getObject<Tile>(tileKey(0, 0));
    const tile1 = bucket.getObject<Tile>(tileKey(1, 1));

    expect(unit.tile).toBe(tile0);
    expect(tile0.unitKeys.has("unit:1")).toBe(true);
    expect(tile1.unitKeys.has("unit:1")).toBe(false);

    // Move unit to tile:1:1
    bucket.setRawObjects([{ key: "unit:1", tileKey: tileKey(1, 1) } as any]);

    expect(unit.tileKey).toBe(tileKey(1, 1));
    expect(unit.tile).toBe(tile1);
    expect(tile0.unitKeys.has("unit:1")).toBe(false);
    expect(tile1.unitKeys.has("unit:1")).toBe(true);
  });

  it("should remove single relation correctly (Unit -> City)", () => {
    const bucket = useDataBucket();

    bucket.setRawObjects([
      ...playerRawData("player:1"),
      ...tileRawData(tileKey(0, 0)),
      ...cityRawData("city:1"),
      ...unitDesignRawData("unitDesign:1"),
      ...unitRawData("unit:1", { cityKey: "city:1" }),
    ]);

    const unit = bucket.getObject<Unit>("unit:1");
    const city = bucket.getObject<City>("city:1");

    expect(unit.cityKey).toBe("city:1");
    expect(city.unitKeys.has("unit:1")).toBe(true);

    // Remove city relation from unit
    bucket.setRawObjects([{ key: "unit:1", cityKey: null } as any]);

    expect(unit.cityKey).toBeNull();
    expect(city.unitKeys.has("unit:1")).toBe(false);
  });

  it("should remove an object and update relations correctly (City)", () => {
    const bucket = useDataBucket();

    bucket.setRawObjects([
      ...playerRawData("player:1"),
      ...tileRawData(tileKey(0, 0)),
      ...cityRawData("city:1", { playerKey: "player:1", tileKey: tileKey(0, 0) }),
    ]);

    const player = bucket.getObject("player:1") as any;
    const tile = bucket.getObject<Tile>(tileKey(0, 0));

    expect(player.cityKeys.has("city:1")).toBe(true);
    expect(tile.cityKey).toBe("city:1");

    bucket.removeObject("city:1");

    expect(player.cityKeys.has("city:1")).toBe(false);
    expect(tile.cityKey).toBeNull();
    expect(() => bucket.getObject("city:1")).toThrow(
      "DataBucket.getObject(city:1) does not exist!",
    );
  });

  describe("Error Handling", () => {
    it("throws when required attribute is missing", () => {
      const bucket = useDataBucket();
      expect(() =>
        bucket.setRawObjects([
          {
            key: tileKey(0, 0),
            y: 0,
            domain: "domainType:land",
            area: "continentType:europe",
            climate: "climateType:temperate",
            terrain: "terrainType:grass",
            elevation: "elevationType:flat",
          } as any,
        ]),
      ).toThrow("Required attribute 'x' missing");
    });

    it("throws when key format is invalid", () => {
      const bucket = useDataBucket();
      expect(() => bucket.setRawObjects([{ key: "invalid-key" } as any])).toThrow(
        "key 'invalid-key' must be format '{class}:{id}'",
      );
    });

    it("throws when game object class is unknown", () => {
      const bucket = useDataBucket();
      expect(() => bucket.setRawObjects([{ key: "unknown:1" } as any])).toThrow(
        "Invalid game obj class: undefined in config for class 'unknown'",
      );
    });

    it("throws when related object does not exist", () => {
      const bucket = useDataBucket();
      expect(() =>
        bucket.setRawObjects([
          ...cityRawData("city:1", { playerKey: "player:99", tileKey: tileKey(0, 0) }),
        ]),
      ).toThrow("Related object 'player:99' does not exist");
    });
  });
});
