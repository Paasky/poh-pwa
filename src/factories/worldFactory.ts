import { ObjKey, World, yearsPerTurnConfig } from "@/types/common";
import { useObjectsStore } from "@/stores/objectStore";
import { GameKey, Tile } from "@/objects/game/gameObjects";
import { TypeObject } from "@/types/typeObjects";

export type WorldSize = {
  name: string;
  x: number;
  y: number;
  continents: 4 | 5 | 6 | 7 | 8 | 9 | 10;
  majorsPerContinent: 1 | 2 | 3 | 4;
  minorsPerPlayer: 0 | 1 | 2;
  seaLevel: 1 | 2 | 3;
};

// Adjusted to satisfy TerraGenerator constraints: y must be multiple of 9 and x = 2 * y
export const worldSizes: WorldSize[] = [
  {
    name: "Tiny",
    x: 72,
    y: 36,
    continents: 4,
    majorsPerContinent: 1,
    minorsPerPlayer: 0,
    seaLevel: 2,
  },
  {
    name: "Small",
    x: 108,
    y: 54,
    continents: 4,
    majorsPerContinent: 2,
    minorsPerPlayer: 2,
    seaLevel: 2,
  },
  {
    name: "Regular",
    x: 144,
    y: 72,
    continents: 5,
    majorsPerContinent: 3,
    minorsPerPlayer: 2,
    seaLevel: 2,
  },
  {
    name: "Large",
    x: 180,
    y: 90,
    continents: 6,
    majorsPerContinent: 4,
    minorsPerPlayer: 2,
    seaLevel: 2,
  },
  {
    name: "Huge",
    x: 252,
    y: 126,
    continents: 10,
    majorsPerContinent: 4,
    minorsPerPlayer: 2,
    seaLevel: 2,
  },
];

export type WorldBundle = {
  world: World;
  tiles: Tile[];
  continents: ContinentData[];
};
export type ContinentData = {
  type: TypeObject;
  majorStarts: Tile[];
  minorStarts: Tile[];
};
export const createWorld = (size: WorldSize): WorldBundle => {
  const objects = useObjectsStore();

  const world = {
    id: crypto.randomUUID(),
    sizeX: size.x,
    sizeY: size.y,
    turn: 0,
    year: yearsPerTurnConfig[0].start,
    currentPlayer: "" as ObjKey,
  } as World;

  const tilesByKey = generateTiles(size);
  const tiles = Object.values(tilesByKey);

  const continentsData = generateContinentsData(size, tilesByKey);

  return {
    world,
    tiles,
    continents: continentsData,
  };

  function generateTiles(size: WorldSize): Record<GameKey, Tile> {
    const tilesByKey = {} as Record<GameKey, Tile>;
    for (let y = 0; y < size.y; y++) {
      for (let x = 0; x < size.x; x++) {
        const tile = new Tile(
          x,
          y,
          objects.getTypeObject("domainType:land"),
          objects.getTypeObject("continentType:taiga"),
          objects.getTypeObject("climateType:temperate"),
          objects.getTypeObject("terrainType:grass"),
          objects.getTypeObject("elevationType:flat"),
        );
        tilesByKey[tile.key] = tile;
      }
    }
    return tilesByKey;
  }

  function generateContinentsData(
    size: WorldSize,
    tilesByKey: Record<GameKey, Tile>,
  ): ContinentData[] {
    // Take x random continents and assign them to the world
    const continents = objects.getClassTypes("continentType");
    const maxContinents = Math.min(size.continents, continents.length);
    const selectedContinents: TypeObject[] = [];
    while (selectedContinents.length < maxContinents) {
      const i = Math.floor(Math.random() * continents.length);
      selectedContinents.push(continents.splice(i, 1)[0]);
    }

    // Take x tiles as continent centers
    const tiles = Object.values(tilesByKey);
    const centers: Tile[] = [];
    const majorStarts: Tile[] = [];
    const minorStarts: Tile[] = [];
    while (centers.length < selectedContinents.length) {
      const randomTile = tiles[Math.floor(Math.random() * tiles.length)];
      if (!tilesByKey[randomTile.key]) continue;

      // Ignore tiles too close to the edge of the map
      if (randomTile.x < 6 || randomTile.x > size.x - 7) continue;
      if (randomTile.y < 6 || randomTile.y > size.y - 7) continue;

      const center = randomTile;
      delete tilesByKey[randomTile.key];
      centers.push(center);

      // For each center, select x major starts
      const continentMajorStarts: Tile[] = [];
      while (continentMajorStarts.length < size.majorsPerContinent) {
        const randomMajorStart = getRandomTile(size, tilesByKey);
        if (!randomMajorStart) continue;

        continentMajorStarts.push(randomMajorStart);
        delete tilesByKey[randomMajorStart.key];

        // For each major start, select x minor starts
        const playerMinorStarts: Tile[] = [];
        while (playerMinorStarts.length < size.minorsPerPlayer) {
          const randomMinorStart = getRandomTile(size, tilesByKey);
          if (!randomMinorStart) continue;

          playerMinorStarts.push(randomMinorStart);
          delete tilesByKey[randomMinorStart.key];
        }
        // Selected all player minor starts
        minorStarts.push(...playerMinorStarts);
      }
      // Selected all continent major starts
      majorStarts.push(...continentMajorStarts);
    }

    return selectedContinents.map(
      (c, i): ContinentData => ({
        type: c,
        majorStarts,
        minorStarts,
      }),
    );
  }

  function getRandomTile(
    size: WorldSize,
    tilesByKey: Record<GameKey, Tile>,
  ): Tile | undefined {
    // Random tile -4 to +4 x & y away (clamp to map size)
    const randX = Math.max(
      0,
      Math.min(size.x - 1, Math.floor(-4 + Math.random() * 8)),
    );
    const randY = Math.max(
      0,
      Math.min(size.y - 1, Math.floor(-4 + Math.random() * 8)),
    );
    return tilesByKey[Tile.getKey(randX, randY)];
  }
};
