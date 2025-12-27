import staticData from "../../public/staticData.json";
import { GameKey, IRawGameObject } from "../../src/objects/game/_GameObject";
import { WorldState } from "../../src/types/common";
import { setDataBucket } from "../../src/Store/useDataBucket";
import { DataBucket, RawStaticData } from "../../src/Store/DataBucket";
import { TestWorldState } from "./testWorld";
import { Culture } from "../../src/objects/game/Culture";
import { Player } from "../../src/objects/game/Player";
import { Tile } from "../../src/objects/game/Tile";
import { City } from "../../src/objects/game/City";
import { Citizen } from "../../src/objects/game/Citizen";
import { UnitDesign } from "../../src/objects/game/UnitDesign";
import { Unit } from "../../src/objects/game/Unit";
import { Construction } from "../../src/objects/game/Construction";
import { Religion } from "../../src/objects/game/Religion";
import { River } from "../../src/objects/game/River";
import { TradeRoute } from "../../src/objects/game/TradeRoute";

export function initTestDataBucket(gameData?: IRawGameObject[], world?: WorldState): DataBucket {
  const rawStaticData = staticData as RawStaticData;
  return setDataBucket(
    DataBucket.fromRaw(rawStaticData, { objects: gameData ?? [], world: world ?? TestWorldState }),
  );
}

// NOTE: using any is allowed here as otherwise TS will complain about nonexistent properties
export function cultureRawData(
  key: GameKey = "culture:1",
  overrides: Partial<Culture> = {},
): IRawGameObject[] {
  return [
    {
      key,
      type: "majorCultureType:viking",
      playerKey: "player:1",
      ...overrides,
    } as any,
  ];
}

export function playerRawData(
  key: GameKey = "player:1",
  overrides: Partial<Player> = {},
): IRawGameObject[] {
  const cultureKey = overrides.cultureKey ?? "culture:1";
  const data = {
    key,
    cultureKey,
    name: "Test Player",
    isCurrent: false,
    isMinor: false,
    religionKey: null,
    ...overrides,
  } as any;

  if (data.religionKey === null) delete data.religionKey;

  return [...cultureRawData(cultureKey as GameKey, { playerKey: key }), data];
}

export function tileRawData(
  key: GameKey = "tile:0:0",
  overrides: Partial<Tile> = {},
): IRawGameObject[] {
  return [
    {
      key,
      x: 0,
      y: 0,
      domain: "domainType:land",
      area: "continentType:europe",
      climate: "climateType:temperate",
      terrain: "terrainType:grass",
      elevation: "elevationType:flat",
      ...overrides,
    } as any,
  ];
}

export function cityRawData(
  key: GameKey = "city:1",
  overrides: Partial<City> = {},
): IRawGameObject[] {
  return [
    {
      key,
      playerKey: "player:1",
      tileKey: "tile:0:0",
      name: "Test City",
      canAttack: false,
      health: 100,
      isCapital: false,
      ...overrides,
    } as any,
  ];
}

export function citizenRawData(
  key: GameKey = "citizen:1",
  overrides: Partial<Citizen> = {},
): IRawGameObject[] {
  const data = {
    key,
    cityKey: "city:1",
    cultureKey: "culture:1",
    playerKey: "player:1",
    tileKey: "tile:0:0",
    ...overrides,
  } as any;

  // TypeObject fields must not be null if we don't want GameDataLoader to attempt resolution
  if (data.policy === null || data.policy === undefined) delete data.policy;
  if (data.religionKey === null || data.religionKey === undefined) delete data.religionKey;

  return [data];
}

export function unitDesignRawData(
  key: GameKey = "unitDesign:1",
  overrides: Partial<UnitDesign> = {},
): IRawGameObject[] {
  return [
    {
      key,
      platform: "platformType:raft",
      equipment: "equipmentType:axe",
      name: "Test Unit Design",
      playerKey: "player:1",
      isElite: false,
      isActive: true,
      ...overrides,
    } as any,
  ];
}

export function unitRawData(
  key: GameKey = "unit:1",
  overrides: Partial<Unit> = {},
): IRawGameObject[] {
  const data = {
    key,
    designKey: "unitDesign:1",
    playerKey: "player:1",
    tileKey: "tile:0:0",
    cityKey: null,
    customName: "",
    action: null,
    canAttack: false,
    health: 100,
    moves: 0,
    ...overrides,
  } as any;

  if (data.cityKey === null) delete data.cityKey;
  if (data.action === null) delete data.action;

  return [data];
}

export function constructionRawData(
  key: GameKey = "construction:1",
  overrides: Partial<Construction> = {},
): IRawGameObject[] {
  const data = {
    key,
    type: "buildingType:granary",
    tileKey: "tile:0:0",
    cityKey: null,
    health: 100,
    progress: 0,
    ...overrides,
  } as any;

  if (data.cityKey === null) delete data.cityKey;

  return [data];
}

export function religionRawData(
  key: GameKey = "religion:1",
  overrides: Partial<Religion> = {},
): IRawGameObject[] {
  return [
    {
      key,
      cityKey: "city:1",
      name: "Test Religion",
      foundedTurn: 1,
      status: "myths",
      myths: [],
      gods: [],
      dogmas: [],
      ...overrides,
    } as any,
  ];
}

export function riverRawData(
  key: GameKey = "river:1",
  overrides: Partial<River> = {},
): IRawGameObject[] {
  return [
    {
      key,
      name: "Test River",
      tileKeys: [],
      ...overrides,
    } as any,
  ];
}

export function tradeRouteRawData(
  key: GameKey = "tradeRoute:1",
  overrides: Partial<TradeRoute> = {},
): IRawGameObject[] {
  return [
    {
      key,
      city1Key: "city:1",
      city2Key: "city:2",
      tileKeys: [],
      unitKey: "unit:1",
      ...overrides,
    } as any,
  ];
}
