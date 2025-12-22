import { GameDataLoader } from "../../src/dataLoaders/GameDataLoader";
import { useObjectsStore } from "../../src/stores/objectStore";
import { GameData } from "../../src/types/api";
import { Tile } from "../../src/objects/game/Tile";
import { GameKey, GameObject } from "../../src/objects/game/_GameObject";
import { Player } from "../../src/objects/game/Player";
import { Unit } from "../../src/objects/game/Unit";
import { City } from "../../src/objects/game/City";

export function createTestWorld() {
  const loader = new GameDataLoader();
  const objectsStore = useObjectsStore();

  const playerKey = "player:1" as GameKey;
  const cultureKey = "culture:1" as GameKey;
  const unitDesignKey = "unitDesign:1" as GameKey;
  const cityKey = "city:1" as GameKey;

  // 5x5 world
  objectsStore.world.size = { x: 5, y: 5 };
  objectsStore.world.currentPlayer = playerKey;

  const gameData: GameData = {
    objects: [
      // Player & Culture
      {
        key: playerKey,
        name: "Test Player",
        cultureKey: cultureKey,
        isCurrent: true,
      },
      {
        key: cultureKey,
        type: "majorCultureType:viking",
        playerKey: playerKey,
      },

      // Unit Design
      {
        key: unitDesignKey,
        platform: "platformType:human",
        equipment: "equipmentType:axe",
        name: "Axeman",
        playerKey: playerKey,
      },

      // Special terrain/objects
      // (1,1) Land with City & Unit
      {
        key: Tile.getKey(1, 1),
        x: 1,
        y: 1,
        domain: "domainType:land",
        area: "continentType:taiga",
        climate: "climateType:temperate",
        terrain: "terrainType:grass",
        elevation: "elevationType:flat",
      },
      {
        key: cityKey,
        playerKey: playerKey,
        tileKey: Tile.getKey(1, 1),
        name: "Test City",
      },
      {
        key: "unit:1",
        playerKey: playerKey,
        designKey: unitDesignKey,
        tileKey: Tile.getKey(1, 1),
        moves: 2,
      },

      // (1,0) Land with River A, (2,0) Land with River B (Crossing check)
      {
        key: Tile.getKey(1, 0),
        x: 1,
        y: 0,
        domain: "domainType:land",
        area: "continentType:taiga",
        climate: "climateType:temperate",
        terrain: "terrainType:grass",
        elevation: "elevationType:flat",
        riverKey: "river:1",
      },
      {
        key: Tile.getKey(2, 0),
        x: 2,
        y: 0,
        domain: "domainType:land",
        area: "continentType:taiga",
        climate: "climateType:temperate",
        terrain: "terrainType:grass",
        elevation: "elevationType:flat",
        riverKey: "river:2",
      },
      { key: "river:1", name: "River A", tileKeys: [Tile.getKey(1, 0)] },
      { key: "river:2", name: "River B", tileKeys: [Tile.getKey(2, 0)] },

      // (2,1) Hill
      {
        key: Tile.getKey(2, 1),
        x: 2,
        y: 1,
        domain: "domainType:land",
        area: "continentType:taiga",
        climate: "climateType:temperate",
        terrain: "terrainType:grass",
        elevation: "elevationType:hill",
      },
      // (3,1) Mountain
      {
        key: Tile.getKey(3, 1),
        x: 3,
        y: 1,
        domain: "domainType:land",
        area: "continentType:taiga",
        climate: "climateType:temperate",
        terrain: "terrainType:grass",
        elevation: "elevationType:mountain",
      },
      // (4,1) Snow Mountain
      {
        key: Tile.getKey(4, 1),
        x: 4,
        y: 1,
        domain: "domainType:land",
        area: "continentType:taiga",
        climate: "climateType:temperate",
        terrain: "terrainType:grass",
        elevation: "elevationType:snowMountain",
      },

      // Water types
      // (1,2) Coast
      {
        key: Tile.getKey(1, 2),
        x: 1,
        y: 2,
        domain: "domainType:water",
        area: "continentType:taiga",
        climate: "climateType:temperate",
        terrain: "terrainType:coast",
        elevation: "elevationType:flat",
      },
      // (2,2) Sea
      {
        key: Tile.getKey(2, 2),
        x: 2,
        y: 2,
        domain: "domainType:water",
        area: "continentType:taiga",
        climate: "climateType:temperate",
        terrain: "terrainType:sea",
        elevation: "elevationType:flat",
      },
      // (3,2) Ocean
      {
        key: Tile.getKey(3, 2),
        x: 3,
        y: 2,
        domain: "domainType:water",
        area: "continentType:taiga",
        climate: "climateType:temperate",
        terrain: "terrainType:ocean",
        elevation: "elevationType:flat",
      },
      // (4,2) Lake
      {
        key: Tile.getKey(4, 2),
        x: 4,
        y: 2,
        domain: "domainType:water",
        area: "continentType:taiga",
        climate: "climateType:temperate",
        terrain: "terrainType:lake",
        elevation: "elevationType:flat",
      },

      // Features
      // (0,1) Forest
      {
        key: Tile.getKey(0, 1),
        x: 0,
        y: 1,
        domain: "domainType:land",
        area: "continentType:taiga",
        climate: "climateType:temperate",
        terrain: "terrainType:grass",
        elevation: "elevationType:flat",
        feature: "featureType:forest",
      },
      // (1,3) Ice
      {
        key: Tile.getKey(1, 3),
        x: 1,
        y: 3,
        domain: "domainType:water",
        area: "continentType:taiga",
        climate: "climateType:temperate",
        terrain: "terrainType:coast",
        elevation: "elevationType:flat",
        feature: "featureType:ice",
      },
    ],
  } as any;

  // Fill the rest of the 5x5 grid with flat grass
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      const key = Tile.getKey(x, y);
      if (!gameData.objects.find((o: any) => o.key === key)) {
        gameData.objects.push({
          key,
          x,
          y,
          domain: "domainType:land",
          area: "continentType:taiga",
          climate: "climateType:temperate",
          terrain: "terrainType:grass",
          elevation: "elevationType:flat",
        });
      }
    }
  }

  const gameObjects = loader.initFromRaw(gameData);
  objectsStore.bulkSet(Object.values(gameObjects));

  // Warm up
  Object.values(gameObjects).forEach((obj: any) => {
    if (typeof obj.warmUp === "function") obj.warmUp();
  });

  return {
    player: objectsStore.getGameObject(playerKey) as Player,
    unit: objectsStore.getGameObject("unit:1") as Unit,
    city: objectsStore.getGameObject(cityKey) as City,
    tiles: objectsStore.getTiles,
    gameObjects: gameObjects as Record<GameKey, GameObject>,
  };
}
