import { beforeEach, describe, expect, it } from "vitest";
import { initTestPinia, loadStaticData } from "../_setup/pinia";
import { createTestWorld } from "../_setup/testWorld";
import { createMovementContext, createPathStep } from "../_setup/gameHelpers";
import { Tile } from "../../src/objects/game/Tile";
import { Unit } from "../../src/objects/game/Unit";
import { useObjectsStore } from "../../src/stores/objectStore";
import { initTypeObject } from "../../src/types/typeObjects";
import { useMoveCostCache } from "../../src/composables/useMoveCostCache";
import { UnitDesign } from "../../src/objects/game/UnitDesign";
import { Construction } from "../../src/objects/game/Construction";
import { GameKey } from "../../src/objects/game/_GameObject";
import { TypeKey } from "../../src/types/common";

describe("MovementService", () => {
  let world: ReturnType<typeof createTestWorld>;
  let objectsStore: ReturnType<typeof useObjectsStore>;
  let cache: ReturnType<typeof useMoveCostCache>;

  beforeEach(() => {
    initTestPinia();
    loadStaticData();
    world = createTestWorld();
    objectsStore = useObjectsStore();
    cache = useMoveCostCache();
    cache.resetCache();
  });

  describe("Mobility & Contextual Constraints", () => {
    it("should identify land/water units as mobile and air/space as immobile", () => {
      const landUnit = world.unit;
      expect(landUnit.movement.isMobile.value).toBe(true);

      // Create a ship
      const galleyPlatform = objectsStore.getTypeObject("platformType:galley");
      const shipDesign = new UnitDesign(
        "unitDesign:ship",
        galleyPlatform,
        objectsStore.getTypeObject("equipmentType:woodRam"),
        "Galley",
        world.player.key,
      );
      objectsStore.set(shipDesign);
      const ship = new Unit("unit:ship", shipDesign.key, world.player.key, Tile.getKey(1, 2));
      expect(ship.movement.isMobile.value).toBe(true);

      // Create an air unit
      const biplanePlatform = objectsStore.getTypeObject("platformType:biplane");
      const airDesign = new UnitDesign(
        "unitDesign:air",
        biplanePlatform,
        objectsStore.getTypeObject("equipmentType:airGun"),
        "Biplane",
        world.player.key,
      );
      objectsStore.set(airDesign);
      const plane = new Unit("unit:air", airDesign.key, world.player.key, Tile.getKey(1, 1));
      expect(plane.movement.isMobile.value).toBe(false);

      // Create a space unit
      const satellitePlatform = objectsStore.getTypeObject("platformType:satellite");
      const spaceDesign = new UnitDesign(
        "unitDesign:space",
        satellitePlatform,
        objectsStore.getTypeObject("equipmentType:axe"),
        "Satellite",
        world.player.key,
      );
      objectsStore.set(spaceDesign);
      const satellite = new Unit(
        "unit:space",
        spaceDesign.key,
        world.player.key,
        Tile.getKey(1, 1),
      );
      expect(satellite.movement.isMobile.value).toBe(false);
    });

    it("should return null cost for immobile units", () => {
      const biplanePlatform = objectsStore.getTypeObject("platformType:biplane");
      const airDesign = new UnitDesign(
        "unitDesign:air",
        biplanePlatform,
        objectsStore.getTypeObject("equipmentType:airGun"),
        "Biplane",
        world.player.key,
      );
      objectsStore.set(airDesign);
      const plane = new Unit("unit:air", airDesign.key, world.player.key, Tile.getKey(1, 1));

      const target = world.tiles[Tile.getKey(2, 1)];
      expect(plane.movement.cost(target)).toBe(null);
    });

    it("should block entry into unknown tiles based on context permission", () => {
      const unit = world.unit;
      const target = world.tiles[Tile.getKey(2, 1)];
      const context = createMovementContext({
        known: new Set(),
        canEnterUnknownThisTurn: false,
      });

      expect(unit.movement.cost(target, undefined, context)).toBe(null);
    });

    it("should allow entry into unknown tiles if permission is granted", () => {
      const unit = world.unit;
      const target = world.tiles[Tile.getKey(2, 1)]; // Hill
      const context = createMovementContext({
        known: new Set(),
        canEnterUnknownThisTurn: true,
      });

      expect(unit.movement.cost(target, undefined, context)).toBe(2);
    });

    it("should block entry if the tile is occupied by an enemy", () => {
      const unit = world.unit;
      const target = world.tiles[Tile.getKey(2, 1)];
      const context = createMovementContext({
        enemyUnitTiles: new Set([target.key]),
      });

      expect(unit.movement.cost(target, undefined, context)).toBe(null);
    });

    it("should block turn end movement if the tile is occupied by a friendly unit (and allow walking through)", () => {
      const unit = world.unit;
      const waterTile = world.tiles[Tile.getKey(1, 2)]; // Coast
      world.player.research.researched.value.push(
        initTypeObject({
          key: "tech:sailing",
          specials: ["specialType:canEmbark"],
        }),
      );

      // 1. Verify it blocks turnEnd moves into occupied tiles
      expect(unit.movement.cost(waterTile)).toBe("turnEnd");
      let context = createMovementContext({ friendlyUnitTiles: new Set([waterTile.key]) });
      expect(unit.movement.calculateNextState(0, 2, waterTile, unit.tile.value, context)).toBe(
        null,
      );

      // 2. Verify it allows normal moves into occupied tiles
      const target = world.tiles[Tile.getKey(0, 0)]; // Grass, cost 1
      expect(unit.movement.cost(target)).toBe(1);
      context = createMovementContext({ friendlyUnitTiles: new Set([target.key]) });
      expect(unit.movement.cost(target, undefined, context)).toBe(1);
    });
  });

  it("should accumulate specials from both unit design and player research", () => {
    const objectsStore = useObjectsStore();
    const customPlatform = initTypeObject({
      key: "platformType:custom",
      specials: ["specialType:canEnterMountains"],
    });
    const shipDesign = new UnitDesign(
      "unitDesign:custom",
      customPlatform,
      objectsStore.getTypeObject("equipmentType:woodRam"),
      "Custom Unit",
      world.player.key,
    );
    objectsStore.set(shipDesign);
    const unit = new Unit("unit:custom", shipDesign.key, world.player.key, Tile.getKey(1, 1));

    // Design special
    expect(unit.movement.specialTypeKeys.value.has("specialType:canEnterMountains")).toBe(true);

    // Player research special
    world.player.research.researched.value.push(
      initTypeObject({ key: "tech:1", specials: ["specialType:canEmbark"] }),
    );
    expect(unit.movement.specialTypeKeys.value.has("specialType:canEmbark")).toBe(true);
    // Still has design special
    expect(unit.movement.specialTypeKeys.value.has("specialType:canEnterMountains")).toBe(true);
  });

  describe("Domain & Special Permissions", () => {
    it("should block land units from entering water without embarkation", () => {
      const unit = world.unit;
      const waterTile = world.tiles[Tile.getKey(1, 2)]; // Coast

      expect(unit.movement.cost(waterTile)).toBe(null);
    });

    it("should allow land units to enter water with embarkation (ends turn)", () => {
      const unit = world.unit;
      const waterTile = world.tiles[Tile.getKey(1, 2)]; // Coast

      // Give special
      world.player.research.researched.value.push(
        initTypeObject({
          key: "tech:sailing",
          specials: ["specialType:canEmbark"],
        }),
      );

      expect(unit.movement.cost(waterTile)).toBe("turnEnd");
    });

    it("should allow water units to enter land ONLY via City or Canal", () => {
      const objectsStore = useObjectsStore();
      const shipDesign = new UnitDesign(
        "unitDesign:ship",
        objectsStore.getTypeObject("platformType:galley"),
        objectsStore.getTypeObject("equipmentType:woodRam"),
        "Galley",
        world.player.key,
      );
      objectsStore.set(shipDesign);
      const ship = new Unit("unit:ship", shipDesign.key, world.player.key, Tile.getKey(1, 2));

      const cityTile = world.tiles[Tile.getKey(1, 1)];
      const plainLandTile = world.tiles[Tile.getKey(0, 0)];

      // City: allowed (ends turn)
      expect(ship.movement.cost(cityTile)).toBe("turnEnd");

      // Plain land: blocked
      expect(ship.movement.cost(plainLandTile)).toBe(null);

      // Canal: allowed (ends turn)
      const canalType = initTypeObject({ key: "improvementType:canal", name: "Canal" });
      const canalConstruction = new Construction(
        "construction:canal" as GameKey,
        canalType,
        plainLandTile.key,
      );
      objectsStore.set(canalConstruction);
      plainLandTile.constructionKey.value = canalConstruction.key;

      expect(ship.movement.cost(plainLandTile)).toBe("turnEnd");

      // Leaving City/Canal back to water: also ends turn
      const coastTile = world.tiles[Tile.getKey(1, 2)];
      expect(ship.movement.cost(coastTile, cityTile)).toBe("turnEnd");
    });

    it("should allow water units to move between adjacent cities/canals with cost 1", () => {
      const objectsStore = useObjectsStore();
      const shipDesign = new UnitDesign(
        "unitDesign:ship",
        objectsStore.getTypeObject("platformType:galley"),
        objectsStore.getTypeObject("equipmentType:woodRam"),
        "Galley",
        world.player.key,
      );
      objectsStore.set(shipDesign);

      const city1 = world.tiles[Tile.getKey(1, 1)];
      const city2 = world.tiles[Tile.getKey(0, 0)];
      city2.cityKey.value = "city:2" as GameKey; // Mock city presence

      const ship = new Unit("unit:ship", shipDesign.key, world.player.key, city1.key);

      // Moving between two land tiles that both have cities: cost 1
      expect(ship.movement.cost(city2, city1)).toBe(1);
    });

    it("should allow water units to move between water tiles with cost 1", () => {
      const objectsStore = useObjectsStore();
      const shipDesign = new UnitDesign(
        "unitDesign:ship",
        objectsStore.getTypeObject("platformType:galley"),
        objectsStore.getTypeObject("equipmentType:woodRam"),
        "Galley",
        world.player.key,
      );
      objectsStore.set(shipDesign);
      const ship = new Unit("unit:ship", shipDesign.key, world.player.key, Tile.getKey(1, 2)); // Coast

      const anotherCoast = world.tiles[Tile.getKey(0, 0)]; // Make it coast for test
      anotherCoast.domain = objectsStore.getTypeObject("domainType:water");
      anotherCoast.terrain = objectsStore.getTypeObject("terrainType:coast");

      expect(ship.movement.cost(anotherCoast)).toBe(1);
    });

    it("should enforce water unit terrain permissions (Sea, Ocean, Ice)", () => {
      const objectsStore = useObjectsStore();
      const shipDesign = new UnitDesign(
        "unitDesign:ship",
        objectsStore.getTypeObject("platformType:galley"),
        objectsStore.getTypeObject("equipmentType:woodRam"),
        "Galley",
        world.player.key,
      );
      objectsStore.set(shipDesign);
      const ship = new Unit("unit:ship", shipDesign.key, world.player.key, Tile.getKey(1, 2));

      const seaTile = world.tiles[Tile.getKey(2, 2)];
      const oceanTile = world.tiles[Tile.getKey(3, 2)];
      const iceTile = world.tiles[Tile.getKey(1, 3)];

      // Blocked by default
      expect(ship.movement.cost(seaTile)).toBe(null);
      expect(ship.movement.cost(oceanTile)).toBe(null);
      expect(ship.movement.cost(iceTile)).toBe(null);

      // Give permissions
      world.player.research.researched.value.push(
        initTypeObject({ key: "t1", specials: ["specialType:canEnterSea"] }),
      );
      expect(ship.movement.cost(seaTile)).toBe(1);

      world.player.research.researched.value.push(
        initTypeObject({ key: "t2", specials: ["specialType:canEnterOcean"] }),
      );
      expect(ship.movement.cost(oceanTile)).toBe(1);

      world.player.research.researched.value.push(
        initTypeObject({ key: "t3", specials: ["specialType:canEnterIce"] }),
      );
      expect(ship.movement.cost(iceTile)).toBe(1);
    });

    it("should enforce terrain/feature specials (Sea, Ocean, Ice, Mountains, Snow Mountains)", () => {
      const unit = world.unit;
      const seaTile = world.tiles[Tile.getKey(2, 2)];
      const oceanTile = world.tiles[Tile.getKey(3, 2)];
      const iceTile = world.tiles[Tile.getKey(1, 3)];
      const mountainTile = world.tiles[Tile.getKey(3, 1)];
      const snowMountainTile = world.tiles[Tile.getKey(4, 1)];

      // Need embark first
      world.player.research.researched.value.push(
        initTypeObject({
          key: "tech:sailing",
          specials: ["specialType:canEmbark"],
        }),
      );

      expect(unit.movement.cost(seaTile)).toBe(null);
      expect(unit.movement.cost(oceanTile)).toBe(null);
      expect(unit.movement.cost(iceTile)).toBe(null);
      expect(unit.movement.cost(mountainTile)).toBe(null);
      expect(unit.movement.cost(snowMountainTile)).toBe(null);

      // Add specials one by one
      world.player.research.researched.value.push(
        initTypeObject({ key: "t1", specials: ["specialType:canEnterSea"] }),
      );
      expect(unit.movement.cost(seaTile)).toBe("turnEnd");

      world.player.research.researched.value.push(
        initTypeObject({ key: "t2", specials: ["specialType:canEnterOcean"] }),
      );
      expect(unit.movement.cost(oceanTile)).toBe("turnEnd");

      world.player.research.researched.value.push(
        initTypeObject({ key: "t3", specials: ["specialType:canEnterIce"] }),
      );
      expect(unit.movement.cost(iceTile)).toBe("turnEnd");

      world.player.research.researched.value.push(
        initTypeObject({ key: "t4", specials: ["specialType:canEnterMountains"] }),
      );
      expect(unit.movement.cost(mountainTile)).toBe(2);
      expect(unit.movement.cost(snowMountainTile)).toBe(2);
    });
  });

  describe("Turn-Ending Logic", () => {
    it("should force turnEnd when switching domains", () => {
      // todo: test with bridges
      const unit = world.unit;
      const waterTile = world.tiles[Tile.getKey(1, 2)]; // Coast
      world.player.research.researched.value.push(
        initTypeObject({
          key: "tech:sailing",
          specials: ["specialType:canEmbark"],
        }),
      );

      expect(unit.movement.cost(waterTile)).toBe("turnEnd");
    });

    it("should force turnEnd for land units crossing a river", () => {
      // todo: test with bridges
      const unit = world.unit;
      const t00 = world.tiles[Tile.getKey(0, 0)]; // No river
      const t10 = world.tiles[Tile.getKey(1, 0)]; // River A
      const t20 = world.tiles[Tile.getKey(2, 0)]; // River B

      // No river -> River A: turnEnd
      expect(unit.movement.cost(t10, t00)).toBe("turnEnd");

      // River A -> River B: normal cost (1)
      expect(unit.movement.cost(t20, t10)).toBe(1);

      // River A -> River A: normal cost (1)
      expect(unit.movement.cost(t10, t10)).toBe(1);

      // River A -> No river: normal cost (1)
      expect(unit.movement.cost(t00, t10)).toBe(1);
    });

    it("should force turnEnd when entering a swamp", () => {
      const unit = world.unit;
      const swampTile = world.tiles[Tile.getKey(0, 2)];
      swampTile.feature.value = initTypeObject({ key: "featureType:swamp" });

      expect(unit.movement.cost(swampTile)).toBe("turnEnd");
    });
  });

  describe("Cost Calculation Permutations", () => {
    it("should calculate base cost of 1 for flat open terrain (Grass, Plains, Tundra)", () => {
      const unit = world.unit;
      const target = world.tiles[Tile.getKey(0, 0)];

      const standardTerrains = [
        "terrainType:grass",
        "terrainType:plains",
        "terrainType:tundra",
      ] as TypeKey[];

      standardTerrains.forEach((key) => {
        target.terrain = objectsStore.getTypeObject(key);
        expect(unit.movement.cost(target)).toBe(1);
      });
    });

    it("should add +1 for difficult terrain (Desert, Snow)", () => {
      const unit = world.unit;
      const desertTile = world.tiles[Tile.getKey(0, 0)];
      desertTile.terrain = objectsStore.getTypeObject("terrainType:desert");
      expect(unit.movement.cost(desertTile)).toBe(2);

      desertTile.terrain = objectsStore.getTypeObject("terrainType:snow");
      expect(unit.movement.cost(desertTile)).toBe(2);
    });

    it("should add +1 for any elevation (Hills, Mountains, Snow Mountains)", () => {
      const unit = world.unit;
      const hillTile = world.tiles[Tile.getKey(2, 1)];
      expect(unit.movement.cost(hillTile)).toBe(2); // 1 base + 1 hill

      // Mountains and Snow Mountains need specials to even have a cost
      world.player.research.researched.value.push(
        initTypeObject({ key: "t4", specials: ["specialType:canEnterMountains"] }),
      );

      const mountainTile = world.tiles[Tile.getKey(3, 1)];
      expect(unit.movement.cost(mountainTile)).toBe(2); // 1 base + 1 elevation

      const snowMountainTile = world.tiles[Tile.getKey(4, 1)];
      expect(unit.movement.cost(snowMountainTile)).toBe(2); // 1 base + 1 elevation
    });

    it("should add +1 for dense features (Forest, Pine Forest, Jungle, Kelp, Atoll, Lagoon)", () => {
      const unit = world.unit;
      const target = world.tiles[Tile.getKey(0, 0)];

      const denseFeatures = [
        "featureType:forest",
        "featureType:pineForest",
        "featureType:jungle",
        "featureType:kelp",
        "featureType:atoll",
        "featureType:lagoon",
      ] as TypeKey[];

      denseFeatures.forEach((key) => {
        target.feature.value = objectsStore.getTypeObject(key);
        expect(unit.movement.cost(target)).toBe(2); // 1 base + 1 feature
      });
    });

    it("should not add cost for light features (Shrubs, Oasis, FloodPlain)", () => {
      const unit = world.unit;
      const target = world.tiles[Tile.getKey(0, 0)];

      const lightFeatures = [
        "featureType:shrubs",
        "featureType:oasis",
        "featureType:floodPlain",
      ] as TypeKey[];

      lightFeatures.forEach((key) => {
        target.feature.value = objectsStore.getTypeObject(key);
        expect(unit.movement.cost(target)).toBe(1); // 1 base + 0 feature
      });
    });

    it("should apply -0.5 bonus for Trade Winds", () => {
      const unit = world.unit;
      const windTile = world.tiles[Tile.getKey(0, 0)];
      windTile.feature.value = initTypeObject({ key: "featureType:tradeWind" });
      expect(unit.movement.cost(windTile)).toBe(0.5);
    });

    it("should accumulate multiple costs (e.g., Desert Hill Forest)", () => {
      const unit = world.unit;
      const complexTile = world.tiles[Tile.getKey(0, 0)];
      complexTile.terrain = objectsStore.getTypeObject("terrainType:desert");
      complexTile.elevation = objectsStore.getTypeObject("elevationType:hill");
      complexTile.feature.value = objectsStore.getTypeObject("featureType:forest");

      // Math: 1 (base) + 1 (Desert) + 1 (Hill) + 1 (Forest) = 4.0.
      expect(unit.movement.cost(complexTile)).toBe(4);
    });
  });

  describe("Path Walking (move)", () => {
    it("should allow escaping danger but stop when entering a new danger zone (ZOC)", () => {
      const unit = world.unit;
      unit.movement.moves.value = 5;

      // Start at (1,1)
      const t11 = world.tiles[Tile.getKey(1, 1)];
      const t01 = world.tiles[Tile.getKey(0, 1)]; // Escape route
      const t21 = world.tiles[Tile.getKey(2, 1)]; // Hill, neighbors (2,2)

      // Enemy near current tile (1,1) at (2,2)
      const enemyTile = world.tiles[Tile.getKey(2, 2)];
      const context = createMovementContext({ enemyUnitTiles: new Set([enemyTile.key]) });

      // 1. ESCAPE: (1,1) -> (0,1). (0,1) is not neighbor of (2,2)
      unit.movement.path = [createPathStep(t01, 4, 0, true)];
      expect(unit.movement.move(context)).toBe(true);
      expect(unit.tileKey.value).toBe(t01.key);

      // Reset
      unit.tileKey.value = t11.key;
      unit.movement.moves.value = 5;

      // 2. PINNED (Enter new ZOC): (1,1) -> (2,1). (2,1) IS neighbor of (2,2)
      const t31 = world.tiles[Tile.getKey(3, 1)];
      unit.movement.path = [createPathStep(t21, 3, 0, false), createPathStep(t31, 1, 0, true)];

      expect(unit.movement.move(context)).toBe(false); // Should stop at (2,1)
      expect(unit.tileKey.value).toBe(t21.key);
      expect(unit.movement.moves.value).toBe(3);
    });

    it("should respect ignoreZoc policy", () => {
      const unit = world.unit;
      unit.movement.moves.value = 5;
      const t21 = world.tiles[Tile.getKey(2, 1)];
      const t20 = world.tiles[Tile.getKey(2, 0)];

      const enemyAt22 = world.tiles[Tile.getKey(2, 2)];
      const ignoreZocContext = createMovementContext({
        enemyUnitTiles: new Set([enemyAt22.key]),
        ignoreZoc: true,
      });

      unit.movement.path = [createPathStep(t21, 3, 0, false), createPathStep(t20, 0, 0, true)];

      expect(unit.movement.move(ignoreZocContext)).toBe("turnEnd");
      expect(unit.tileKey.value).toBe(t20.key);
    });

    it("should stop moving if moves are exhausted during the walk (with decimal moves check)", () => {
      const unit = world.unit;
      unit.movement.moves.value = 1.2;
      const t1 = world.tiles[Tile.getKey(0, 0)]; // cost 1
      const t2 = world.tiles[Tile.getKey(0, 1)]; // cost 1
      const t3 = world.tiles[Tile.getKey(0, 2)]; // cost 1
      t2.feature.value = null;
      t3.feature.value = null;

      unit.movement.path = [
        createPathStep(t1, 0.2, 0, false),
        createPathStep(t2, 0, 0, true),
        createPathStep(t3, 0, 1, true),
      ];

      const context = createMovementContext();
      const result = unit.movement.move(context);

      // Should walk 2 steps (1.2 -> 0.2 -> 0) and stop
      expect(result).toBe("turnEnd");
      expect(unit.tileKey.value).toBe(t2.key);
      expect(unit.movement.moves.value).toBe(0);
      expect(unit.movement.path.length).toBe(1); // t3 left
      expect(unit.movement.path[0].tile.key).toBe(t3.key);
    });

    it("should update the unit's tileKey for every successful step", () => {
      const unit = world.unit;
      unit.movement.moves.value = 5;
      const t1 = world.tiles[Tile.getKey(0, 0)];
      const t2 = world.tiles[Tile.getKey(0, 1)];

      unit.movement.path = [createPathStep(t1, 4, 0, false), createPathStep(t2, 3, 0, true)];
      const result = unit.movement.move(createMovementContext());

      expect(result).toBe(true);
      expect(unit.tileKey.value).toBe(t2.key);
      expect(unit.movement.moves.value).toBe(2);
      expect(unit.movement.path.length).toBe(0);
    });

    it("should consume all moves when taking a turnEnd step", () => {
      const unit = world.unit;
      unit.movement.moves.value = 5;
      const waterTile = world.tiles[Tile.getKey(1, 2)];
      world.player.research.researched.value.push(
        initTypeObject({
          key: "tech:sailing",
          specials: ["specialType:canEmbark"],
        }),
      );

      unit.movement.path = [createPathStep(waterTile, 0, 1, true)];

      const result = unit.movement.move(createMovementContext());
      expect(result).toBe("turnEnd");
      expect(unit.tileKey.value).toBe(waterTile.key);
      expect(unit.movement.moves.value).toBe(0);
      expect(unit.movement.path.length).toBe(0);
    });

    it("should allow passing through friendly units but refuse to stop on them", () => {
      const unit = world.unit;
      unit.movement.moves.value = 4;
      const initialTileKey = unit.tileKey.value;
      const t1 = world.tiles[Tile.getKey(0, 0)]; // Occupied
      const t2 = world.tiles[Tile.getKey(0, 1)]; // Free

      unit.movement.path = [createPathStep(t1, 3, 0, false), createPathStep(t2, 1, 0, true)];

      // 1. Passing through to a free tile: Success
      let context = createMovementContext({ friendlyUnitTiles: new Set([t1.key]) });
      let result = unit.movement.move(context);
      expect(result).toBe(true);
      expect(unit.tileKey.value).toBe(t2.key);
      expect(unit.movement.moves.value).toBe(1);

      // Reset
      unit.tileKey.value = initialTileKey;
      unit.movement.moves.value = 4;

      // 2. Stopping on an occupied tile (end of path): Refused
      unit.movement.path = [createPathStep(t1, 2, 0, true)];
      context = createMovementContext({ friendlyUnitTiles: new Set([t1.key]) });
      result = unit.movement.move(context);
      expect(result).toBe(false);
      expect(unit.tileKey.value).toBe(initialTileKey);
      expect(unit.movement.moves.value).toBe(4);

      // 3. Stopping on an occupied tile (out of moves): Refused
      unit.movement.moves.value = 1;
      unit.movement.path = [createPathStep(t1, 0, 0, false), createPathStep(t2, -1, 0, true)];
      context = createMovementContext({ friendlyUnitTiles: new Set([t1.key]) });
      result = unit.movement.move(context);
      expect(result).toBe(false);
      expect(unit.tileKey.value).toBe(initialTileKey);
      expect(unit.movement.moves.value).toBe(1);
    });

    it("should refuse to enter a chain of occupied tiles if no free tile is reachable", () => {
      const unit = world.unit;
      unit.movement.moves.value = 5;
      const initialTileKey = unit.tileKey.value;
      const t1 = world.tiles[Tile.getKey(0, 0)]; // Occupied
      const t2 = world.tiles[Tile.getKey(0, 1)]; // Occupied
      const t3 = world.tiles[Tile.getKey(0, 2)]; // Occupied

      unit.movement.path = [
        createPathStep(t1, 4, 0, false),
        createPathStep(t2, 3, 0, false),
        createPathStep(t3, 2, 0, true),
      ];

      const context = createMovementContext({
        friendlyUnitTiles: new Set([t1.key, t2.key, t3.key]),
      });
      const result = unit.movement.move(context);

      expect(result).toBe(false);
      expect(unit.tileKey.value).toBe(initialTileKey);
      expect(unit.movement.moves.value).toBe(5);
    });
  });

  describe("Caching Integrity", () => {
    it("should use the global useMoveCostCache and allow force-updating", () => {
      const unit = world.unit;
      const target = world.tiles[Tile.getKey(0, 0)];

      // First call calculates and caches
      const firstCost = unit.movement.cost(target);
      expect(firstCost).toBe(1);

      // Verify it's in cache
      const design = unit.design.value;
      const cacheKey = cache.getCacheKey(design, unit.movement.specialTypeKeys.value);
      expect(cache.getMoveCost(cacheKey, unit.tile.value.key, target.key)).toBe(1);

      // Force update the cache with a fake value
      cache.setMoveCost(cacheKey, unit.tile.value.key, target.key, 5);

      // Second call should return the fake cached value
      expect(unit.movement.cost(target)).toBe(5);
    });
  });
});
