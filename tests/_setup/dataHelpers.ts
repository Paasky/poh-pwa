import { GameKey, IRawGameObject } from "@/Common/Models/_GameTypes";
import { WorldState } from "@/Common/Objects/World";
import { setDataBucket } from "@/Data/useDataBucket";
import { DataBucket } from "@/Data/DataBucket";
import { TestWorldState } from "./testWorld";
import { tileKey } from "@/Common/Helpers/mapTools";
import { getCachedStaticData } from "./staticDataGlobal";

export async function initTestDataBucket(
  gameData?: IRawGameObject[],
  world?: WorldState,
): Promise<DataBucket> {
  const rawData = await getCachedStaticData();
  return setDataBucket(DataBucket.fromRaw(rawData, world ?? TestWorldState, gameData));
}

// NOTE: using any is allowed here as otherwise TS will complain about nonexistent properties
export function cultureRawData(key: GameKey = "culture:1", overrides: any = {}): IRawGameObject[] {
  return [
    {
      key,
      type: "majorCultureType:viking",
      playerKey: "player:1",
      ...overrides,
    } as any,
  ];
}

export function playerRawData(key: GameKey = "player:1", overrides: any = {}): IRawGameObject[] {
  // Use player ID for default relation keys
  const id = key.split(":")[1];
  const cultureKey = (overrides.cultureKey ?? `culture:${id}`) as GameKey;
  const diplomacyKey = (overrides.diplomacyKey ?? `diplomacy:${id}`) as GameKey;
  const governmentKey = (overrides.governmentKey ?? `government:${id}`) as GameKey;
  const researchKey = (overrides.researchKey ?? `research:${id}`) as GameKey;

  const data = {
    key,
    cultureKey,
    diplomacyKey,
    governmentKey,
    researchKey,
    name: "Test Player",
    isCurrent: false,
    isMinor: false,
    religionKey: null,
    knownPlayerKeys: [],
    knownReligionKeys: [],
    knownTileKeys: [],
    ...overrides,
  } as any;

  if (data.religionKey === null) delete data.religionKey;

  return [
    ...cultureRawData(cultureKey, { playerKey: key }),
    { key: diplomacyKey, playerKey: key } as any,
    { key: governmentKey, playerKey: key } as any,
    { key: researchKey, playerKey: key } as any,
    data,
  ];
}

export function tileRawData(key: GameKey = tileKey(0, 0), overrides: any = {}): IRawGameObject[] {
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

export function cityRawData(key: GameKey = "city:1", overrides: any = {}): IRawGameObject[] {
  return [
    {
      key,
      playerKey: "player:1",
      tileKey: tileKey(0, 0),
      name: "Test City",
      canAttack: false,
      health: 100,
      isCapital: false,
      ...overrides,
    } as any,
  ];
}

export function citizenRawData(key: GameKey = "citizen:1", overrides: any = {}): IRawGameObject[] {
  const data = {
    key,
    cityKey: "city:1",
    cultureKey: "culture:1",
    playerKey: "player:1",
    tileKey: tileKey(0, 0),
    ...overrides,
  } as any;

  // TypeObject fields must not be null if we don't want GameDataLoader to attempt resolution
  if (data.policy === null || data.policy === undefined) delete data.policy;
  if (data.religionKey === null || data.religionKey === undefined) delete data.religionKey;

  return [data];
}

export function unitDesignRawData(
  key: GameKey = "unitDesign:1",
  overrides: any = {},
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

export function unitRawData(key: GameKey = "unit:1", overrides: any = {}): IRawGameObject[] {
  const data = {
    key,
    designKey: "unitDesign:1",
    playerKey: "player:1",
    tileKey: tileKey(0, 0),
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
  overrides: any = {},
): IRawGameObject[] {
  const data = {
    key,
    type: "buildingType:granary",
    tileKey: tileKey(0, 0),
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
  overrides: any = {},
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

export function riverRawData(key: GameKey = "river:1", overrides: any = {}): IRawGameObject[] {
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
  overrides: any = {},
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
