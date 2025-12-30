import { ObjKey, yearsPerTurnConfig } from "@/Common/Objects/Common";
import { useDataBucket } from "@/Data/useDataBucket";
import { TerraGenerator } from "@/factories/TerraGenerator/terra-generator";
import { shuffle, takeRandom } from "@/helpers/arrayTools";
import { Player } from "@/Common/Models/Player";
import { generateKey } from "@/Common/Models/_GameModel";
import { Culture } from "@/Common/Models/Culture";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { Unit } from "@/Common/Models/Unit";
import { GameData } from "@/types/api";
import { Tile } from "@/Common/Models/Tile";
import { MapGenConfig } from "@/stores/mapGenStore";

export type WorldSize = {
  name: string;
  x: number;
  y: number;
  continents: 4 | 5 | 6 | 7 | 8 | 9 | 10;
  majorsPerContinent: 1 | 2 | 3 | 4;
  minorsPerPlayer: 0 | 1 | 2;
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
  },
  {
    name: "Small",
    x: 108,
    y: 54,
    continents: 4,
    majorsPerContinent: 2,
    minorsPerPlayer: 2,
  },
  {
    name: "Regular",
    x: 144,
    y: 72,
    continents: 5,
    majorsPerContinent: 3,
    minorsPerPlayer: 2,
  },
  {
    name: "Large",
    x: 180,
    y: 90,
    continents: 6,
    majorsPerContinent: 4,
    minorsPerPlayer: 2,
  },
  {
    name: "Huge",
    x: 252,
    y: 126,
    continents: 10,
    majorsPerContinent: 4,
    minorsPerPlayer: 2,
  },
];

export const createWorld = (
  config: MapGenConfig & { flipX?: boolean; flipY?: boolean; flipClimate?: boolean },
): GameData => {
  const bucket = useDataBucket();
  const { size } = config;

  const bundle = {
    world: {
      id: crypto.randomUUID(),
      size,
      turn: 0,
      year: yearsPerTurnConfig[0].start,
      currentPlayer: "" as ObjKey,
    },
    objects: [],
  } as GameData;

  const objects = [] as any[];
  const players = [] as Player[];

  // Init global data
  const cultureTypes = bucket.getClassTypes("majorCultureType");

  const humanPlatform = bucket.getType("platformType:human");

  const spearEquipment = bucket.getType("equipmentType:spear");
  const javelinEquipment = bucket.getType("equipmentType:javelin");
  const workerEquipment = bucket.getType("equipmentType:worker");
  const tribeEquipment = bucket.getType("equipmentType:tribe");

  const warbandDesign = new UnitDesign(
    generateKey("unitDesign"),
    humanPlatform,
    spearEquipment,
    "Warband",
  );
  const hunterDesign = new UnitDesign(
    generateKey("unitDesign"),
    humanPlatform,
    javelinEquipment,
    "Hunter",
  );
  const workerDesign = new UnitDesign(
    generateKey("unitDesign"),
    humanPlatform,
    workerEquipment,
    "Worker",
  );
  const tribeDesign = new UnitDesign(
    generateKey("unitDesign"),
    humanPlatform,
    tribeEquipment,
    "Tribe",
  );
  objects.push(warbandDesign, hunterDesign, workerDesign, tribeDesign);

  const gen = new TerraGenerator(size, config.flipX, config.flipY, config.flipClimate)
    .generateStratLevel()
    .generateRegLevel()
    .generateGameLevel();
  objects.push(...Object.values(gen.gameTiles), ...Object.values(gen.rivers));

  // Validate that all tiles & rivers exist
  for (let y = 0; y < size.y; y++) {
    for (let x = 0; x < size.x; x++) {
      const tile = gen.gameTiles[Tile.getKey(x, y)];
      if (!tile) {
        throw new Error(`Tile (x${x},y${y}) not found in generated tiles`);
      }
      if (tile.riverKey) {
        const river = gen.rivers[tile.riverKey as any];
        if (!river) {
          throw new Error(
            `River ${tile.riverKey} not found in generated rivers: ${JSON.stringify(Object.keys(gen.rivers))}`,
          );
        }
      }
    }
  }

  for (const continentData of shuffle(Object.values(gen.continents))) {
    const continentStartCultures = cultureTypes.filter(
      (c) => !c.upgradesFrom.length && c.category!.includes(`:${continentData.type.id}`),
    );

    for (const tile of shuffle(continentData.majorStarts.game)) {
      if (players.length >= config.continents * config.majorsPerContinent) break;

      const cultureKey = generateKey("culture");
      const player = new Player(
        generateKey("player"),
        cultureKey,
        "Player " + (players.length + 1),
        !bundle.world.currentPlayer,
      );
      objects.push(player);
      players.push(player);
      if (player.isCurrent) {
        bundle.world.currentPlayer = player.key;
      }

      const cultureType = takeRandom(continentStartCultures);
      const culture = new Culture(cultureKey, cultureType, player.key);

      objects.push(culture);
      player.cultureKey = culture.key;

      player.designKeys.push(warbandDesign.key, hunterDesign.key, workerDesign.key);

      const hunter = new Unit(generateKey("unit"), hunterDesign.key, player.key, tile.key);
      const tribe = new Unit(generateKey("unit"), tribeDesign.key, player.key, tile.key);
      objects.push(hunter, tribe);
      player.unitKeys.push(hunter.key, tribe.key);
      tile.unitKeys.push(hunter.key, tribe.key);
      hunterDesign.unitKeys.push(hunter.key);
      tribeDesign.unitKeys.push(tribe.key);
    }
  }

  // Validate players
  if (!bundle.world.currentPlayer) {
    throw new Error("No current player set");
  }
  for (const player of players) {
    if (!player.cultureKey) {
      throw new Error(`Player ${player.key} has no culture`);
    }
    if (player.designKeys.length < 3) {
      throw new Error(`Player ${player.key} has less than 3 designs`);
    }
    if (player.unitKeys.length < 2) {
      throw new Error(`Player ${player.key} has less than 2 units`);
    }
  }

  bundle.objects = objects.map((o) => (o.toJSON ? o.toJSON() : o));
  return bundle;
};
