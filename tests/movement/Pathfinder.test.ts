import { beforeEach, describe, expect, it } from "vitest";
import { Unit } from "@/objects/game/Unit";
import { Tile } from "@/objects/game/Tile";
import { useObjectsStore } from "@/stores/objectStore";
import { initTestPinia, loadStaticData } from "../_setup/pinia";
import { createTestWorld } from "../_setup/testWorld";
import { createMovementContext, createPathStep } from "../_setup/gameHelpers";
import { GameKey } from "../../src/Common/Models/_GameModel";
import { initTypeObject } from "@/types/typeObjects";
import { useMoveCostCache } from "@/composables/useMoveCostCache";
import { Pathfinder } from "../../src/movement/Pathfinder";

describe("Pathfinder", () => {
  let pathfinder: Pathfinder;
  let world: ReturnType<typeof createTestWorld>;
  let objectsStore: ReturnType<typeof useObjectsStore>;

  beforeEach(() => {
    initTestPinia();
    loadStaticData();
    pathfinder = new Pathfinder();
    world = createTestWorld();
    objectsStore = useObjectsStore();
    useMoveCostCache().resetCache();
  });

  it("should find a simple path on land", () => {
    const unit = world.unit;
    const targetTile = world.gameObjects[Tile.getKey(2, 1)] as Tile; // Hill
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    const path = pathfinder.findPath(unit, targetTile, context);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1].tile.key).toBe(targetTile.key);

    // Check move points deduction
    // (1,1) to (2,1) is Hill. Cost is 2.
    // Unit starts with 2 moves.
    expect(path[0]).toEqual(createPathStep(targetTile, 0, 0, true));
  });

  it("should return empty path if target is same as start", () => {
    const unit = world.unit;
    const targetTile = unit.tile;
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    const path = pathfinder.findPath(unit, targetTile, context);
    expect(path.length).toBe(0);
  });

  it("should correctly identify reachable tiles with strict validation", () => {
    const unit = world.unit;
    unit.movement.moves.value = 2;
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    const rangeData = pathfinder.getTilesInRange(unit, context);

    // Unit at (1,1), moves=2.
    // Expected range neighbors (based on createTestWorld):
    // (1,0) River, (2,0) River, (2,1) Hill (cost 2), (0,1) Forest (cost 2)
    // Plus distance-2 tiles reachable via these...

    // Reachable tiles (cost !== null)
    expect(rangeData.get(Tile.getKey(1, 0))?.cost).not.toBeNull(); // River
    expect(rangeData.get(Tile.getKey(2, 0))?.cost).not.toBeNull(); // River
    expect(rangeData.get(Tile.getKey(2, 1))?.cost).not.toBeNull(); // Hill

    // Blocked tiles (cost === null)
    expect(rangeData.get(Tile.getKey(1, 2))?.cost).toBeNull(); // Water
    expect(rangeData.get(Tile.getKey(2, 2))?.cost).toBeNull(); // Sea
    // expect(rangeData.get(Tile.getKey(3, 1))?.cost).toBeNull(); // Removed because it's now out of range

    // Verify it includes blocked tiles
    expect(rangeData.has(Tile.getKey(3, 1))).toBe(false);
  });

  it("should not include tiles that are beyond reach when unit ends turn exactly on a tile", () => {
    const unit = world.unit;
    const tiles = objectsStore.getTiles;

    // Setup: Unit at (1,1) with 1 move.
    // Neighbor (0,1) is made flat grass (cost 1).
    const targetNeighbor = tiles[Tile.getKey(0, 1)];
    targetNeighbor.elevation = objectsStore.getTypeObject("elevationType:flat");
    targetNeighbor.feature.value = null;

    unit.movement.moves.value = 1;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
    });

    const rangeData = pathfinder.getTilesInRange(unit, context);

    // (0,1) is reachable and should be in range
    expect(rangeData.has(targetNeighbor.key)).toBe(true);

    // (0,0) is a neighbor of (0,1) but NOT of (1,1).
    // It is 2 steps away from (1,1). With only 1 move, it should NOT be in rangeData.
    expect(rangeData.has(Tile.getKey(0, 0))).toBe(false);
  });

  it("should return no tiles in range if unit has 0 moves", () => {
    const unit = world.unit;
    unit.movement.moves.value = 0;
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    const rangeData = pathfinder.getTilesInRange(unit, context);
    expect(rangeData.size).toBe(0); // Should be empty even if neighbors are rivers
  });

  it("should find path through multiple turns", () => {
    const unit = world.unit;
    unit.movement.moves.value = 1; // Only 1 move per turn
    const targetTile2 = world.gameObjects[Tile.getKey(0, 0)] as Tile;
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    const path = pathfinder.findPath(unit, targetTile2, context);
    expect(path.length).toBeGreaterThan(1);
    const lastStep = path[path.length - 1];
    expect(lastStep.turn).toBeGreaterThan(0);
  });

  it("should avoid enemy units", () => {
    const unit = world.unit;
    const targetTile = world.gameObjects[Tile.getKey(2, 1)] as Tile;
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
      enemyUnitTiles: new Set([targetTile.key]), // Enemy at target
    });

    const path = pathfinder.findPath(unit, targetTile, context);
    expect(path.length).toBe(0); // Cannot path to enemy-occupied tile
  });

  it("should find the fastest route by wrapping x", () => {
    const unit = world.unit as Unit;
    // Move unit to (0,0)
    const startTile = world.gameObjects[Tile.getKey(0, 0)] as Tile;
    unit.tileKey.value = startTile.key;

    // (4,0) is Land in createTestWorld (filled by loop)
    const targetTile = world.gameObjects[Tile.getKey(4, 0)] as Tile;
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    const path = pathfinder.findPath(unit, targetTile, context);
    // 5x5 world, (0,0) to (4,0) is 1 step via wrapping (w neighbor of (0,0) at y=0 is (4,0))
    expect(path.length).toBe(1);
    expect(path[0].tile.key).toBe(targetTile.key);
  });

  it("should find tiles in range more than 1 tile away when moves > 1", () => {
    const unit = world.unit as Unit;
    unit.movement.moves.value = 4; // Give 4 moves
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    const rangeData = pathfinder.getTilesInRange(unit, context);

    // From (1,1), (3,0) is 2 steps away (via (2,1) Hill or (2,0) Flat)
    // Path: (1,1) -> (2,1) [cost 2] -> (3,0) [cost 1]. Total 3 moves.
    expect(rangeData.has(Tile.getKey(3, 0))).toBe(true);

    // (4,0) is 3 steps away from (1,1)
    // (1,1) -> (2,1) -> (3,0) -> (4,0). Total 4 moves.
    expect(rangeData.has(Tile.getKey(4, 0))).toBe(true);
  });

  it("should be blocked if turn would end on a friendly unit", () => {
    const unit = world.unit as Unit;
    unit.movement.moves.value = 2;
    const tiles = objectsStore.getTiles;

    // (1,1) to (2,1) is Hill (cost 2).
    // If unit has 2 moves, turn ends on (2,1).
    const targetTile = world.gameObjects[Tile.getKey(3, 0)] as Tile;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
      friendlyUnitTiles: new Set([Tile.getKey(2, 1)]), // Friendly unit on the intermediate hill
    });

    const path = pathfinder.findPath(unit, targetTile, context);
    expect(path.length).toBeGreaterThan(0);

    // Should NOT go through (2,1) because turn ends there and it's occupied by friendly unit.
    // It should try to go around if possible.
    // Neighbors of (1,1) are (0,1), (2,1), (1,0), (2,0), (1,2), (2,2).
    // If we put friendly unit on all valid neighbors where turn ends, it should be blocked.
    const blockedContext = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
      friendlyUnitTiles: new Set([
        Tile.getKey(2, 1),
        Tile.getKey(2, 0),
        Tile.getKey(1, 0),
        Tile.getKey(0, 1),
        Tile.getKey(1, 2),
      ]),
    });

    const pathBlocked = pathfinder.findPath(unit, targetTile, blockedContext);
    expect(pathBlocked.length).toBe(0);
  });

  it("should be blocked if target is occupied by a friendly unit", () => {
    const unit = world.unit as Unit;
    const targetTile = world.gameObjects[Tile.getKey(2, 1)] as Tile;
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
      friendlyUnitTiles: new Set([targetTile.key]),
    });

    const path = pathfinder.findPath(unit, targetTile, context);
    expect(path.length).toBe(0);
  });

  it("should not path through unknown tiles in future turns", () => {
    const unit = world.unit as Unit;
    unit.movement.moves.value = 1; // Only 1 move, can't reach any neighbor in 1 turn (neighbors are hills or cross rivers)
    // Wait, let's check neighbors of (1,1)
    // (1,1) is grass flat.
    // (2,1) is Hill (cost 2).
    // (2,0) is flat grass but crosses river (cost 99).
    // (0,1) is Forest (cost 2).
    // (1,0) is flat grass (no river? wait, (1,0) has river:1). (1,1) has no river. Cross river -> 99.
    // (0,0) is flat grass (filled by loop). No river.
    // Let's check (0,0) in createTestWorld.
    // Neighbors of (1,1) in hex odd-r:
    // (y=1 is odd): w: (0,1), e: (2,1), nw: (1,0), ne: (2,0), sw: (1,2), se: (2,2)
    // Wait, getHexNeighborDirections(y):
    // isOdd ? { w: -1,0, e: 1,0, nw: 0,-1, ne: 1,-1, sw: 0,1, se: 1,1 }
    // (1,1) neighbors:
    // w: (0,1) - Forest (cost 2)
    // e: (2,1) - Hill (cost 2)
    // nw: (1,0) - Land, river:1 (cost 99)
    // ne: (2,0) - Land, river:2 (cost 99)
    // sw: (1,2) - Coast (cost 99 for land unit)
    // se: (2,2) - Sea (cost 99)
    //
    // So all neighbors of (1,1) cost > 1.
    // If unit has 1 move, it cannot reach any neighbor in Turn 0.
    // It will reach them in Turn 1.

    const targetTile = world.gameObjects[Tile.getKey(2, 1)] as Tile;
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set([unit.tileKey.value]), // Only knows current tile
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    const path = pathfinder.findPath(unit, targetTile, context);
    // Entering an unknown tile is allowed on the current turn, even if it ends the turn
    expect(path.length).toBe(1);
  });

  it("should mark turn ends correctly for single-turn and multi-turn paths", () => {
    const unit = world.unit;
    const tiles = objectsStore.getTiles;
    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
    });

    // 1. Single step reachable this turn
    unit.movement.moves.value = 5;
    const t21 = tiles[Tile.getKey(2, 1)]; // Hill, cost 2
    let path = pathfinder.findPath(unit, t21, context);
    expect(path.length).toBe(1);
    expect(path[0].isTurnEnd).toBe(true);
    expect(path[0].turn).toBe(0);

    // 2. Single step reachable this turn via overshoot (ends turn)
    unit.movement.moves.value = 1;
    path = pathfinder.findPath(unit, t21, context);
    expect(path.length).toBe(1);
    expect(path[0].isTurnEnd).toBe(true);
    expect(path[0].turn).toBe(0); // Arrives this turn via overshoot

    // 3. Two steps, both reachable this turn
    unit.movement.moves.value = 10;
    const t30 = tiles[Tile.getKey(3, 0)]; // (1,1) -> (2,1) [2] -> (3,0) [1] = 3 total
    path = pathfinder.findPath(unit, t30, context);
    expect(path.length).toBe(2);
    expect(path[0].isTurnEnd).toBe(false); // (2,1)
    expect(path[1].isTurnEnd).toBe(true); // (3,0)
    expect(path[1].turn).toBe(0);

    // 4. Two steps, 1st ends turn
    unit.movement.moves.value = 2; // (2,1) costs 2, so turn ends there
    path = pathfinder.findPath(unit, t30, context);
    expect(path.length).toBe(2);
    expect(path[0].isTurnEnd).toBe(true); // (2,1) ends turn 0
    expect(path[0].turn).toBe(0);
    expect(path[1].isTurnEnd).toBe(true); // (3,0) ends turn 1
    expect(path[1].turn).toBe(1);
  });

  it("should return empty path for unreachable targets (islands)", () => {
    const unit = world.unit as Unit;
    // (3,2) is Ocean.
    // Let's make an island surrounded by Ocean.
    // In createTestWorld, (3,2) is Ocean and it is unreachable for a land unit.

    const targetTile = world.gameObjects[Tile.getKey(3, 2)] as Tile; // Ocean
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    // Land unit cannot enter water without embarkation
    const path = pathfinder.findPath(unit, targetTile, context);
    expect(path.length).toBe(0);
  });

  it("should allow entering water/mountains with proper special types", () => {
    const unit = world.unit;
    const waterTile = world.gameObjects[Tile.getKey(1, 2)] as Tile; // Coast
    const mountainTile = world.gameObjects[Tile.getKey(3, 1)] as Tile; // Mountain
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    // No embarkation tech
    expect(pathfinder.findPath(unit, waterTile, context).length).toBe(0);

    // Give embarkation tech
    world.player.research.researched.push(
      initTypeObject({
        key: "tech:sailing",
        specials: ["specialType:canEmbark"],
      }),
    );
    useMoveCostCache().resetCache();

    expect(pathfinder.findPath(unit, waterTile, context).length).toBeGreaterThan(0);

    // No mountain climbing tech
    expect(pathfinder.findPath(unit, mountainTile, context).length).toBe(0);

    // Give mountain climbing tech
    world.player.research.researched.push(
      initTypeObject({
        key: "tech:mountaineering",
        specials: ["specialType:canEnterMountains"],
      }),
    );
    useMoveCostCache().resetCache();

    expect(pathfinder.findPath(unit, mountainTile, context).length).toBeGreaterThan(0);
  });

  it("should find a path starting with 0 moves (wait for next turn)", () => {
    const unit = world.unit as Unit;
    unit.movement.moves.value = 0;
    const targetTile = world.gameObjects[Tile.getKey(2, 1)] as Tile;
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    const path = pathfinder.findPath(unit, targetTile, context);
    expect(path.length).toBeGreaterThan(0);
    expect(path[0].turn).toBe(1);
  });

  it("should respect unit's max moves for multi-turn paths", () => {
    const unit = world.unit as Unit;
    // Give unit 4 moves
    unit.movement.moves.value = 4;
    // We can't easily change the design yields without mocking, but we can verify it uses the design
    // The current design (Axeman) has 2 moves.
    // If we want to test 4 moves, we can change the design's yield?
    // Axeman platform is footTravel.
    // Let's just verify that if we change unit.movement.moves.value, it uses it for turn 0.

    const farTarget = world.gameObjects[Tile.getKey(3, 0)] as Tile;
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    const path = pathfinder.findPath(unit, farTarget, context);
    // (1,1) -> (2,1) [cost 2] -> (3,0) [cost 1].
    // Total cost to (3,0) is 3. So it should reach (3,0) on turn 0 if it has 4 moves.
    expect(path.length).toBeGreaterThan(0);
    const lastStep = path[path.length - 1];
    expect(lastStep.tile.key).toBe(farTarget.key);
    expect(lastStep.turn).toBe(0);
    expect(lastStep.movesRemaining).toBe(1); // 4 - 3 = 1
  });

  it("should block embarking if target is occupied by a friendly unit", () => {
    const unit = world.unit;
    // Give embarkation tech
    world.player.research.researched.push(
      initTypeObject({
        key: "tech:sailing",
        specials: ["specialType:canEmbark"],
      }),
    );
    useMoveCostCache().resetCache();

    const waterTile = world.gameObjects[Tile.getKey(1, 2)] as Tile; // Coast (Water)
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
      friendlyUnitTiles: new Set([waterTile.key]), // Friendly unit in the water
    });

    const path = pathfinder.findPath(unit, waterTile, context);
    // Unit.ts: if (from.domain.key !== to.domain.key) { if (context?.friendlyUnitTiles.has(to.key)) return null; }
    expect(path.length).toBe(0);
  });

  it("should treat domain switching as a move that arrives on turn 0 but ends the turn", () => {
    const unit = world.unit;
    unit.movement.moves.value = 2;
    // Give embarkation tech
    world.player.research.researched.push(
      initTypeObject({
        key: "tech:sailing",
        specials: ["specialType:canEmbark"],
      }),
    );
    useMoveCostCache().resetCache();

    const waterTile = world.gameObjects[Tile.getKey(1, 2)] as Tile; // Coast (Water)
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    const path = pathfinder.findPath(unit, waterTile, context);
    expect(path.length).toBeGreaterThan(0);
    const lastStep = path[path.length - 1];
    expect(lastStep.turn).toBe(0);
    expect(lastStep.movesRemaining).toBe(0);
  });

  it("should include turn-ending moves in range even if cost > movesRemaining", () => {
    const unit = world.unit;
    unit.movement.moves.value = 2;
    // Give embarkation tech
    world.player.research.researched.push(
      initTypeObject({
        key: "tech:sailing",
        specials: ["specialType:canEmbark"],
      }),
    );
    useMoveCostCache().resetCache();

    const waterTile = world.gameObjects[Tile.getKey(1, 2)] as Tile; // Coast (Water)
    const tiles = objectsStore.getTiles;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    const rangeData = pathfinder.getTilesInRange(unit, context);
    // Since moveCost returns "turnEnd" and unit has some moves left, it IS reachable this turn
    expect(rangeData.has(waterTile.key)).toBe(true);
    expect(rangeData.get(waterTile.key)?.cost).toBe("turnEnd");
  });

  it("should choose a faster flat land path over a shorter but slower hill path", () => {
    const tiles = objectsStore.getTiles;

    const unit = world.unit as Unit;
    unit.tileKey.value = Tile.getKey(0, 0);
    unit.movement.moves.value = 4;

    const targetTile = tiles[Tile.getKey(1, 1)];

    // Path 1: (0,0) -> (0,1) [Forest, cost 2] -> (1,1). Cost: 2 + 1 = 3.
    // Path 2: (0,0) -> (1,0) [Flat, cost 1] -> (1,1). Cost: 1 + 1 = 2.
    // (1,0) has a river in createTestWorld, let's remove it to avoid turn end cost
    tiles[Tile.getKey(1, 0)].riverKey = null;

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    const path = pathfinder.findPath(unit, targetTile, context);

    // Should choose Path 2
    expect(path.length).toBe(2);
    expect(path[0].tile.key).toBe(Tile.getKey(1, 0));
    expect(path[1].tile.key).toBe(targetTile.key);

    // Verify move points deduction
    expect(path[0].movesRemaining).toBe(3); // 4 - 1
    expect(path[1].movesRemaining).toBe(2); // 3 - 1
  });

  it("should choose to go over a hill instead of crossing a river if it's faster", () => {
    const tiles = objectsStore.getTiles;
    const unit = world.unit as Unit;
    unit.tileKey.value = Tile.getKey(1, 1);
    unit.movement.moves.value = 4;

    const targetTile = tiles[Tile.getKey(3, 0)];

    const context = createMovementContext({
      known: new Set(Object.keys(tiles) as GameKey[]),
      visible: new Set(Object.keys(tiles) as GameKey[]),
    });

    const path = pathfinder.findPath(unit, targetTile, context);
    // Path: (1,1) -> (2,1) [Hill, cost 2] -> (3,0) [Flat, cost 1]. Total cost 3.
    // Alternative via (2,0) involves River B crossing (cost 99).
    expect(path.length).toBe(2);
    expect(path[0].tile.key).toBe(Tile.getKey(2, 1));
    expect(path[1].tile.key).toBe(targetTile.key);
    expect(path[1].turn).toBe(0); // Should reach on turn 0
  });
});
