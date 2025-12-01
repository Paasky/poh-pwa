import { beforeEach, describe, expect, it } from "vitest";
import { GameDataLoader } from "../../src/dataLoaders/GameDataLoader";
import { initTestPinia, loadStaticData } from "../_setup/pinia";
import { Tile } from "../../src/objects/game/Tile";
import { GameData } from "../../src/types/api";

describe("gameDataLoader", () => {
  beforeEach(() => initTestPinia() && loadStaticData());

  it("Throws on missing/invalid key/data", () => {
    const loader = new GameDataLoader();

    const missingKey = {};
    expect(() => loader.initFromRaw({ objects: [missingKey] } as GameData)).toThrow(
      `Invalid game obj data: key is missing from ${JSON.stringify(missingKey)}`,
    );

    const invalidKey = { key: "test" };
    expect(() => loader.initFromRaw({ objects: [invalidKey] } as GameData)).toThrow(
      `Invalid game obj data: key 'test' must be format '{class}:{id}'`,
    );

    const invalidClass = { key: "test:1" };
    expect(() => loader.initFromRaw({ objects: [invalidClass] } as GameData)).toThrow(
      `Invalid game obj class: undefined in config for class 'test'`,
    );

    const withoutName = {
      key: "player:1",
    };
    expect(() => loader.initFromRaw({ objects: [withoutName] } as GameData)).toThrow(
      `Required attribute 'name' missing from ${JSON.stringify(withoutName)}`,
    );

    const invalidTypeKey = {
      key: "culture:1",
      type: "majorCultureType:test",
      playerKey: "player:1",
    };
    expect(() => loader.initFromRaw({ objects: [invalidTypeKey] } as GameData)).toThrow(
      `[objStore] Tried to getTypeObject(majorCultureType:test), key does not exist in store`,
    );

    const playerData = {
      key: "player:1",
      name: "test player",
    };
    const invalidRelationKey = {
      key: "culture:1",
      type: "majorCultureType:viking",
      playerKey: "player:2",
    };
    expect(() =>
      loader.initFromRaw({ objects: [playerData, invalidRelationKey] } as GameData),
    ).toThrow(
      `obj: culture:1, conf: {"attrName":"playerKey","attrNotRef":true,"related":{"theirKeyAttr":"cultureKey","isOne":true}}, msg: Related object player:2 not found for {"attrName":"playerKey","attrNotRef":true,"related":{"theirKeyAttr":"cultureKey","isOne":true}} in {"key":"culture:1","type":"majorCultureType:viking","playerKey":"player:2"}`,
    );
  });

  it("Build game objects and returns correct JSON, without optional", () => {
    const loader = new GameDataLoader();

    const tileCoords = { x: 12, y: 23 };
    const tileKey = Tile.getKey(tileCoords.x, tileCoords.y);

    // todo Agenda
    const citizenData = {
      key: "citizen:1",
      cityKey: "city:1",
      cultureKey: "culture:1",
      tileKey: tileKey,
    };
    const cityData = {
      key: "city:1",
      playerKey: "player:1",
      tileKey: tileKey,
      name: "test city",
    };
    // todo Construction
    const cultureData = {
      key: "culture:1",
      type: "majorCultureType:viking",
      playerKey: "player:1",
    };
    // todo Deal
    const playerData = {
      key: "player:1",
      name: "test player",
    };
    const religionData = {
      key: "religion:1",
      name: "test religion",
      myths: ["mythType:godMother"],
      gods: ["godType:godOfTrade"],
      dogmas: ["dogmaType:clergy"],
      cityKey: "city:1",
      foundedTurn: 1,
    };
    const tileData = {
      key: tileKey,
      x: tileCoords.x,
      y: tileCoords.y,
      domain: "domainType:land",
      area: "continentType:taiga",
      climate: "climateType:cold",
      terrain: "terrainType:tundra",
      elevation: "elevationType:hill",
    };
    const tradeRouteData = {
      key: "tradeRoute:1",
      unitKey: "unit:1",
      tileKeys: [tileKey],
      city1Key: "city:1",
      city2Key: "city:1",
    };
    const unitData = {
      key: "unit:1",
      cityKey: "city:1",
      designKey: "unitDesign:1",
      playerKey: "player:1",
      tileKey: tileKey,
    };
    const unitDesignData = {
      key: "unitDesign:1",
      platform: "platformType:human",
      equipment: "equipmentType:axe",
      name: "Axeman",
      playerKey: "player:1",
    };

    const gameObjects = loader.initFromRaw({
      objects: [
        citizenData,
        cityData,
        cultureData,
        playerData,
        religionData,
        tileData,
        tradeRouteData,
        unitData,
        unitDesignData,
      ],
    } as GameData);

    // output = input + defaults
    expect(JSON.parse(JSON.stringify(gameObjects))).toEqual({
      "citizen:1": citizenData,
      "city:1": {
        ...cityData,
        canAttack: false,
        health: 100,
        isCapital: false,
        origPlayerKey: "player:1",
      },
      "culture:1": cultureData,
      "player:1": { ...playerData, isCurrent: false },
      "religion:1": { ...religionData, status: "myths" },
      "tile:x12,y23": tileData,
      "tradeRoute:1": tradeRouteData,
      "unit:1": {
        ...unitData,
        canAttack: false,
        health: 100,
        moves: 0,
        name: "",
        status: "regular",
        origPlayerKey: "player:1",
      },
      "unitDesign:1": { ...unitDesignData, isActive: true, isElite: false },
    });
  });

  it("Build game objects and returns correct JSON, with optional", () => {
    const loader = new GameDataLoader();

    const playerData = {
      key: "player:1",
      name: "test player",
      isCurrent: true,
    };

    const gameObjects = loader.initFromRaw({ objects: [playerData] } as GameData);

    expect(JSON.parse(JSON.stringify(gameObjects))).toEqual({ "player:1": playerData });
  });
});
