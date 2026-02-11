import { useDataBucket } from "@/Data/useDataBucket";
import { tileKey } from "@/Common/Helpers/mapTools";
import { WorldState } from "@/Common/Objects/World";

export const TestWorldState: WorldState = {
  id: "test-world",
  size: { x: 15, y: 10 },
  turn: 0,
  year: -10000,
};

const WATER_TERRAINS = new Set([
  "terrainType:coast",
  "terrainType:sea",
  "terrainType:ocean",
  "terrainType:lake",
  "terrainType:majorRiver",
]);
const SALT_WATER_TERRAINS = new Set(["terrainType:coast", "terrainType:sea", "terrainType:ocean"]);

export function createTestWorld() {
  const rawObjects = tilesData.map((tile) => {
    const isWater = WATER_TERRAINS.has(tile.terrain);
    const isSalt = SALT_WATER_TERRAINS.has(tile.terrain);
    const isWest = tile.x < 8;

    const domain = isWater ? "domainType:water" : "domainType:land";
    const area = isSalt
      ? isWest
        ? "oceanType:pacific"
        : "oceanType:atlantic"
      : isWest
        ? "continentType:america"
        : "continentType:europe";

    const raw: Record<string, unknown> = {
      key: tileKey(tile.x, tile.y),
      x: tile.x,
      y: tile.y,
      domain,
      area,
      climate: "climateType:temperate",
      terrain: tile.terrain,
      elevation: tile.elevation ?? "elevationType:flat",
    };

    if (tile.feature) raw.feature = tile.feature;
    if (tile.route) raw.route = tile.route;
    if (tile.improvement) raw.improvement = tile.improvement;
    if (tile.isFresh) raw.isFresh = true;

    return raw;
  });

  const riverTileKeys: Record<1 | 2, string[]> = { 1: [], 2: [] };
  tilesData.forEach((tile) => {
    if (tile.river) riverTileKeys[tile.river].push(tileKey(tile.x, tile.y));
  });

  const riverObjects = [
    { key: "river:1", name: "Smallbrook", tileKeys: riverTileKeys[1] },
    { key: "river:2", name: "Greatflow", tileKeys: riverTileKeys[2] },
  ];

  useDataBucket().setRawObjects([...rawObjects, ...riverObjects] as any);
  useDataBucket().setWorld(TestWorldState);
}

const tilesData: Array<{
  x: number;
  y: number;
  terrain: string;
  feature?: string;
  elevation?: string;
  improvement?: string;
  route?: string;
  isFresh?: true;
  river?: 1 | 2;
}> = [
  { x: 0, y: 0, terrain: "terrainType:ocean", feature: "featureType:ice" },
  { x: 1, y: 0, terrain: "terrainType:sea", feature: "featureType:ice" },
  { x: 2, y: 0, terrain: "terrainType:coast" },
  { x: 3, y: 0, terrain: "terrainType:snow" },
  { x: 4, y: 0, terrain: "terrainType:snow" },
  { x: 5, y: 0, terrain: "terrainType:snow" },
  { x: 6, y: 0, terrain: "terrainType:snow", feature: "featureType:ice" },
  { x: 7, y: 0, terrain: "terrainType:snow", feature: "featureType:ice" },
  { x: 8, y: 0, terrain: "terrainType:snow" },
  { x: 9, y: 0, terrain: "terrainType:snow" },
  { x: 10, y: 0, terrain: "terrainType:snow" },
  { x: 11, y: 0, terrain: "terrainType:snow" },
  { x: 12, y: 0, terrain: "terrainType:coast" },
  { x: 13, y: 0, terrain: "terrainType:sea" },
  { x: 14, y: 0, terrain: "terrainType:ocean", feature: "featureType:ice" },

  { x: 0, y: 1, terrain: "terrainType:sea", feature: "featureType:ice" },
  { x: 1, y: 1, terrain: "terrainType:coast" },
  { x: 2, y: 1, terrain: "terrainType:tundra", feature: "featureType:swamp" },
  { x: 3, y: 1, terrain: "terrainType:tundra", feature: "featureType:swamp" },
  { x: 4, y: 1, terrain: "terrainType:tundra" },
  { x: 5, y: 1, terrain: "terrainType:tundra", feature: "featureType:pineForest" },
  { x: 6, y: 1, terrain: "terrainType:snow", feature: "featureType:ice" },
  { x: 7, y: 1, terrain: "terrainType:tundra", isFresh: true },
  { x: 8, y: 1, terrain: "terrainType:tundra", elevation: "elevationType:hill", isFresh: true },
  { x: 9, y: 1, terrain: "terrainType:tundra", elevation: "elevationType:hill" },
  { x: 10, y: 1, terrain: "terrainType:tundra", elevation: "elevationType:mountain" },
  { x: 11, y: 1, terrain: "terrainType:tundra", isFresh: true },
  { x: 12, y: 1, terrain: "terrainType:coast" },
  { x: 13, y: 1, terrain: "terrainType:sea" },
  { x: 14, y: 1, terrain: "terrainType:sea" },

  { x: 0, y: 2, terrain: "terrainType:coast" },
  { x: 1, y: 2, terrain: "terrainType:coast" },
  { x: 2, y: 2, terrain: "terrainType:grass" },
  { x: 3, y: 2, terrain: "terrainType:grass", feature: "featureType:swamp" },
  { x: 4, y: 2, terrain: "terrainType:grass", river: 1 },
  {
    x: 5,
    y: 2,
    terrain: "terrainType:tundra",
    feature: "featureType:pineForest",
    elevation: "elevationType:hill",
  },
  { x: 6, y: 2, terrain: "terrainType:tundra", feature: "featureType:pineForest" },
  { x: 7, y: 2, terrain: "terrainType:tundra", isFresh: true },
  { x: 8, y: 2, terrain: "terrainType:lake", feature: "featureType:kelp", isFresh: true },
  { x: 9, y: 2, terrain: "terrainType:tundra", elevation: "elevationType:hill", isFresh: true },
  {
    x: 10,
    y: 2,
    terrain: "terrainType:tundra",
    elevation: "elevationType:mountain",
    isFresh: true,
  },
  {
    x: 11,
    y: 2,
    terrain: "terrainType:tundra",
    elevation: "elevationType:mountain",
    isFresh: true,
  },
  { x: 12, y: 2, terrain: "terrainType:majorRiver", river: 2, isFresh: true },
  { x: 13, y: 2, terrain: "terrainType:coast" },
  { x: 14, y: 2, terrain: "terrainType:coast" },

  { x: 0, y: 3, terrain: "terrainType:desert" },
  { x: 1, y: 3, terrain: "terrainType:plains" },
  {
    x: 2,
    y: 3,
    terrain: "terrainType:plains",
    feature: "featureType:shrubs",
    elevation: "elevationType:hill",
  },
  { x: 3, y: 3, terrain: "terrainType:grass", river: 1 },
  {
    x: 4,
    y: 3,
    terrain: "terrainType:grass",
    feature: "featureType:forest",
    elevation: "elevationType:hill",
  },
  { x: 5, y: 3, terrain: "terrainType:grass", feature: "featureType:forest" },
  { x: 6, y: 3, terrain: "terrainType:grass", isFresh: true },
  { x: 7, y: 3, terrain: "terrainType:lake", feature: "featureType:kelp", isFresh: true },
  { x: 8, y: 3, terrain: "terrainType:lake", feature: "featureType:kelp", isFresh: true },
  { x: 9, y: 3, terrain: "terrainType:majorRiver", river: 2, isFresh: true },
  { x: 10, y: 3, terrain: "terrainType:grass", isFresh: true },
  { x: 11, y: 3, terrain: "terrainType:majorRiver", river: 2, isFresh: true },
  { x: 12, y: 3, terrain: "terrainType:desert", feature: "featureType:floodPlain", isFresh: true },
  { x: 13, y: 3, terrain: "terrainType:desert" },
  { x: 14, y: 3, terrain: "terrainType:desert" },

  { x: 0, y: 4, terrain: "terrainType:plains" },
  { x: 1, y: 4, terrain: "terrainType:plains" },
  { x: 2, y: 4, terrain: "terrainType:plains", feature: "featureType:shrubs" },
  { x: 3, y: 4, terrain: "terrainType:plains", feature: "featureType:shrubs" },
  { x: 4, y: 4, terrain: "terrainType:grass", river: 1, isFresh: true },
  { x: 5, y: 4, terrain: "terrainType:grass", feature: "featureType:forest", isFresh: true },
  { x: 6, y: 4, terrain: "terrainType:grass", isFresh: true, route: "routeType:cobbledRoad" },
  {
    x: 7,
    y: 4,
    terrain: "terrainType:majorRiver",
    river: 2,
    route: "routeType:cobbledRoad",
    improvement: "improvementType:stoneBridge",
    isFresh: true,
  },
  { x: 8, y: 4, terrain: "terrainType:lake", isFresh: true },
  {
    x: 9,
    y: 4,
    terrain: "terrainType:plains",
    elevation: "elevationType:snowMountain",
    isFresh: true,
  },
  { x: 10, y: 4, terrain: "terrainType:majorRiver", river: 2, isFresh: true },
  { x: 11, y: 4, terrain: "terrainType:majorRiver", river: 2, isFresh: true },
  { x: 12, y: 4, terrain: "terrainType:desert", feature: "featureType:floodPlain", isFresh: true },
  { x: 13, y: 4, terrain: "terrainType:desert" },
  { x: 14, y: 4, terrain: "terrainType:coast" },

  { x: 0, y: 5, terrain: "terrainType:grass" },
  { x: 1, y: 5, terrain: "terrainType:grass" },
  { x: 2, y: 5, terrain: "terrainType:grass" },
  { x: 3, y: 5, terrain: "terrainType:grass", isFresh: true },
  { x: 4, y: 5, terrain: "terrainType:majorRiver", river: 2, isFresh: true },
  { x: 5, y: 5, terrain: "terrainType:majorRiver", river: 2, isFresh: true },
  { x: 6, y: 5, terrain: "terrainType:majorRiver", river: 2, isFresh: true },
  { x: 7, y: 5, terrain: "terrainType:plains", isFresh: true, route: "routeType:cobbledRoad" },
  {
    x: 8,
    y: 5,
    terrain: "terrainType:plains",
    elevation: "elevationType:snowMountain",
    isFresh: true,
  },
  {
    x: 9,
    y: 5,
    terrain: "terrainType:plains",
    elevation: "elevationType:snowMountain",
    isFresh: true,
  },
  {
    x: 10,
    y: 5,
    terrain: "terrainType:grass",
    feature: "featureType:jungle",
    elevation: "elevationType:hill",
    isFresh: true,
  },
  { x: 11, y: 5, terrain: "terrainType:plains", isFresh: true },
  { x: 12, y: 5, terrain: "terrainType:grass" },
  { x: 13, y: 5, terrain: "terrainType:tundra" },
  { x: 14, y: 5, terrain: "terrainType:coast" },

  { x: 0, y: 6, terrain: "terrainType:tundra" },
  { x: 1, y: 6, terrain: "terrainType:coast" },
  { x: 2, y: 6, terrain: "terrainType:coast" },
  { x: 3, y: 6, terrain: "terrainType:coast" },
  { x: 4, y: 6, terrain: "terrainType:grass", route: "routeType:canal", isFresh: true },
  { x: 5, y: 6, terrain: "terrainType:grass", isFresh: true },
  { x: 6, y: 6, terrain: "terrainType:grass", isFresh: true },
  { x: 7, y: 6, terrain: "terrainType:grass", isFresh: true },
  { x: 8, y: 6, terrain: "terrainType:grass" },
  { x: 9, y: 6, terrain: "terrainType:grass" },
  { x: 10, y: 6, terrain: "terrainType:grass", feature: "featureType:jungle" },
  { x: 11, y: 6, terrain: "terrainType:grass", feature: "featureType:jungle" },
  { x: 12, y: 6, terrain: "terrainType:grass" },
  { x: 13, y: 6, terrain: "terrainType:tundra" },
  { x: 14, y: 6, terrain: "terrainType:coast" },

  { x: 0, y: 7, terrain: "terrainType:coast" },
  { x: 1, y: 7, terrain: "terrainType:sea" },
  { x: 2, y: 7, terrain: "terrainType:sea" },
  { x: 3, y: 7, terrain: "terrainType:coast" },
  { x: 4, y: 7, terrain: "terrainType:tundra" },
  { x: 5, y: 7, terrain: "terrainType:tundra" },
  { x: 6, y: 7, terrain: "terrainType:coast", feature: "featureType:atoll" },
  { x: 7, y: 7, terrain: "terrainType:coast" },
  { x: 8, y: 7, terrain: "terrainType:coast", feature: "featureType:lagoon" },
  { x: 9, y: 7, terrain: "terrainType:tundra" },
  { x: 10, y: 7, terrain: "terrainType:coast" },
  { x: 11, y: 7, terrain: "terrainType:coast" },
  { x: 12, y: 7, terrain: "terrainType:coast" },
  { x: 13, y: 7, terrain: "terrainType:coast" },
  { x: 14, y: 7, terrain: "terrainType:sea" },

  { x: 0, y: 8, terrain: "terrainType:sea" },
  { x: 1, y: 8, terrain: "terrainType:sea" },
  { x: 2, y: 8, terrain: "terrainType:ocean" },
  { x: 3, y: 8, terrain: "terrainType:sea" },
  { x: 4, y: 8, terrain: "terrainType:coast" },
  { x: 5, y: 8, terrain: "terrainType:coast" },
  { x: 6, y: 8, terrain: "terrainType:coast" },
  { x: 7, y: 8, terrain: "terrainType:sea" },
  { x: 8, y: 8, terrain: "terrainType:sea" },
  { x: 9, y: 8, terrain: "terrainType:coast" },
  { x: 10, y: 8, terrain: "terrainType:coast" },
  { x: 11, y: 8, terrain: "terrainType:sea" },
  { x: 12, y: 8, terrain: "terrainType:sea" },
  { x: 13, y: 8, terrain: "terrainType:sea" },
  { x: 14, y: 8, terrain: "terrainType:sea" },

  { x: 0, y: 9, terrain: "terrainType:ocean" },
  { x: 1, y: 9, terrain: "terrainType:ocean" },
  { x: 2, y: 9, terrain: "terrainType:ocean" },
  { x: 3, y: 9, terrain: "terrainType:sea" },
  { x: 4, y: 9, terrain: "terrainType:sea" },
  { x: 5, y: 9, terrain: "terrainType:sea" },
  { x: 6, y: 9, terrain: "terrainType:sea" },
  { x: 7, y: 9, terrain: "terrainType:ocean" },
  { x: 8, y: 9, terrain: "terrainType:sea" },
  { x: 9, y: 9, terrain: "terrainType:sea" },
  { x: 10, y: 9, terrain: "terrainType:sea" },
  { x: 11, y: 9, terrain: "terrainType:ocean", feature: "featureType:tradeWind" },
  { x: 12, y: 9, terrain: "terrainType:ocean", feature: "featureType:tradeWind" },
  { x: 13, y: 9, terrain: "terrainType:ocean", feature: "featureType:tradeWind" },
  { x: 14, y: 9, terrain: "terrainType:ocean" },
];
