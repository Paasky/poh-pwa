import { ObjKey, WorldState, yearsPerTurnConfig } from "@/Common/Objects/World";
import { useDataBucket } from "@/Data/useDataBucket";
import { TerraGenerator } from "@/Common/factories/TerraGenerator/terra-generator";
import { shuffle, takeRandom } from "@/Common/Helpers/arrayTools";
import { GameObject, generateKey, type IRawGameObject } from "@/Common/Models/_GameModel";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { Unit } from "@/Common/Models/Unit";
import { Tile } from "@/Common/Models/Tile";
import { MapGenConfig } from "@/App/stores/mapGenStore";
import { createPlayer } from "@/Common/factories/models/player";

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
    name: "Tiny (36 x 72)",
    x: 72,
    y: 36,
    continents: 4,
    majorsPerContinent: 1,
    minorsPerPlayer: 0,
  },
  {
    name: "Small (54 x 108)",
    x: 108,
    y: 54,
    continents: 4,
    majorsPerContinent: 2,
    minorsPerPlayer: 2,
  },
  {
    name: "Regular (72 x 144)",
    x: 144,
    y: 72,
    continents: 5,
    majorsPerContinent: 3,
    minorsPerPlayer: 2,
  },
  {
    name: "Large (90 x 180)",
    x: 180,
    y: 90,
    continents: 6,
    majorsPerContinent: 4,
    minorsPerPlayer: 2,
  },
  {
    name: "Huge (126 x 252)",
    x: 252,
    y: 126,
    continents: 10,
    majorsPerContinent: 4,
    minorsPerPlayer: 2,
  },
];

export const createWorld = (
  config: MapGenConfig & { flipX?: boolean; flipY?: boolean; flipClimate?: boolean },
): { objects: IRawGameObject[]; world: WorldState } => {
  const bucket = useDataBucket();
  const { size } = config;

  const bundle = {
    objects: [] as IRawGameObject[],
    world: {
      id: crypto.randomUUID(),
      size,
      turn: 0,
      year: yearsPerTurnConfig[0].start,
      currentPlayerKey: "" as ObjKey,
    },
  } as { objects: IRawGameObject[]; world: WorldState };

  const objects = [] as GameObject[];
  const players = [] as ReturnType<typeof createPlayer>[];

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
        const river = gen.rivers[tile.riverKey];
        if (!river) {
          throw new Error(
            `River ${tile.riverKey} not found in generated rivers: ${JSON.stringify(Object.keys(gen.rivers))}`,
          );
        }
      }
    }
  }

  for (const continentData of shuffle(Object.values(gen.continents))) {
    const continentStartCultures = Array.from(cultureTypes).filter(
      (c) => !c.upgradesFrom.length && c.category!.includes(`:${continentData.type.id}`),
    );

    for (const tile of shuffle(continentData.majorStarts.game)) {
      if (players.length >= config.continents * config.majorsPerContinent) break;

      const cultureType = takeRandom(continentStartCultures);
      const cluster = createPlayer({
        cultureType,
        userName: "Actor " + (players.length + 1),
      });
      players.push(cluster);

      if (!bundle.world.currentPlayerKey) {
        bundle.world.currentPlayerKey = cluster.player.key;
        cluster.player.isHuman = true;
      }

      objects.push(...cluster.all);

      cluster.player.designKeys.add(warbandDesign.key);
      cluster.player.designKeys.add(hunterDesign.key);
      cluster.player.designKeys.add(workerDesign.key);

      const hunter = new Unit(generateKey("unit"), hunterDesign.key, cluster.player.key, tile.key);
      const tribe = new Unit(generateKey("unit"), tribeDesign.key, cluster.player.key, tile.key);
      objects.push(hunter, tribe);
      cluster.player.unitKeys.add(hunter.key);
      cluster.player.unitKeys.add(tribe.key);
      tile.unitKeys.add(hunter.key);
      tile.unitKeys.add(tribe.key);
      hunterDesign.unitKeys.add(hunter.key);
      tribeDesign.unitKeys.add(tribe.key);
    }
  }

  // Validate players
  for (const { player } of players) {
    if (!player.cultureKey) {
      throw new Error(`Player ${player.key} has no culture`);
    }
    if (player.designKeys.size < 3) {
      throw new Error(`Player ${player.key} has less than 3 designs`);
    }
    if (player.unitKeys.size < 2) {
      throw new Error(`Player ${player.key} has less than 2 units`);
    }
  }

  bundle.objects = objects.map((o) => (o.toJSON ? o.toJSON() : o) as IRawGameObject);
  return bundle;
};
