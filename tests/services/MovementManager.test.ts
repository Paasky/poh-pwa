import { beforeEach, describe, expect, it } from "vitest";
import { initTestPinia, loadStaticData } from "../_setup/pinia";
import { createTestWorld } from "../_setup/testWorld";
import { Tile } from "../../src/objects/game/Tile";
import { MovementManager } from "../../src/services/MovementManager";
import { useCurrentContext } from "../../src/composables/useCurrentContext";

describe("MovementManager", () => {
  let world: ReturnType<typeof createTestWorld>;

  beforeEach(() => {
    initTestPinia();
    loadStaticData();
    world = createTestWorld();
  });

  it("should execute a move and clear action mode/selection", () => {
    const unit = world.unit;
    unit.movement.moves.value = 5;
    const target = world.tiles[Tile.getKey(0, 0)]; // Grass, reachable in 2 steps

    const current = useCurrentContext();
    current.actionMode.value = "move";
    current.object.value = unit;
    current.tile.value = unit.tile.value;

    MovementManager.moveTo(unit, target);

    // Verify unit moved
    expect(unit.tileKey.value).toBe(target.key);
    expect(unit.movement.moves.value).toBe(2);

    // Verify context cleared
    expect(current.actionMode.value).toBeUndefined();
    expect(current.object.value).toBeUndefined();
    expect(current.tile.value).toBeUndefined();
  });

  it("should do nothing if no path is found", () => {
    const unit = world.unit;
    const waterTile = world.tiles[Tile.getKey(1, 2)]; // Coast, blocked for land unit without tech

    const current = useCurrentContext();
    current.actionMode.value = "move";
    current.object.value = unit;

    const initialTileKey = unit.tileKey.value;

    MovementManager.moveTo(unit, waterTile);

    // Verify unit did NOT move
    expect(unit.tileKey.value).toBe(initialTileKey);

    // Context should still be cleared though, as intent was processed
    expect(current.actionMode.value).toBeUndefined();
  });
});
