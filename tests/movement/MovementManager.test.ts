import { beforeEach, describe, expect, it, vi } from "vitest";
import { initTestPinia, loadStaticData } from "../_setup/pinia";
import { createTestWorld } from "../_setup/testWorld";
import { Tile } from "../../src/Common/Models/Tile";
import { MovementManager } from "../../src/Simulation/Movement/MovementManager";
import { useCurrentContext } from "../../src/composables/useCurrentContext";
import { useAppStore } from "../../src/stores/appStore";
import { EngineLayers } from "@/Actor/Human/EngineStyles";
import { PohEngine } from "@/Actor/Human/PohEngine";

describe("MovementManager", () => {
  let world: ReturnType<typeof createTestWorld>;

  beforeEach(() => {
    initTestPinia();
    loadStaticData();
    world = createTestWorld();
  });

  it("should execute a move and clear action mode/selection", async () => {
    const unit = world.unit;
    unit.movement.moves.value = 5;
    const target = world.tiles[Tile.getKey(0, 0)]; // Grass, reachable in 2 steps

    const current = useCurrentContext();
    current.actionMode.value = "move";
    current.object.value = unit;
    current.tile.value = unit.tile;

    MovementManager.moveTo(unit, target);

    // Verify unit moved
    expect(unit.tileKey.value).toBe(target.key);
    expect(unit.movement.moves.value).toBe(2);

    // Verify tile relations updated
    expect(target.unitKeys.value).toContain(unit.key);
    expect(world.tiles[Tile.getKey(1, 1)].unitKeys.value).not.toContain(unit.key);
  });

  it("should do nothing if no path is found", () => {
    const unit = world.unit;
    const waterTile = world.tiles[Tile.getKey(1, 2)]; // Coast, blocked for land unit without tech

    const current = useCurrentContext();
    current.actionMode.value = "move";
    current.object.value = unit;

    const initialTileKey = unit.tileKey;

    MovementManager.moveTo(unit, waterTile);

    // Verify unit did NOT move
    expect(unit.tileKey.value).toBe(initialTileKey);

    // Context should NOT be cleared either
    expect(current.actionMode.value).toBe("move");
  });

  it("should clear selection when unit is out of moves", async () => {
    const unit = world.unit;
    unit.movement.moves.value = 1; // Not enough to move to (0,0) normally?
    // Let's pick a target that costs exactly all moves or more.
    // Grass is cost 1.
    const target = world.tiles[Tile.getKey(1, 0)];

    const current = useCurrentContext();
    current.actionMode.value = "move";
    current.object.value = unit;
    current.tile.value = unit.tile;

    const app = useAppStore();

    const setLayerSpy = vi.fn().mockReturnThis();
    app.engineService = {
      contextOverlay: { setLayer: setLayerSpy },
      guidanceOverlay: { setLayer: setLayerSpy },
      detailOverlay: { setLayer: setLayerSpy },
      pathOverlay: { setLayer: setLayerSpy },
    } as unknown as PohEngine;

    MovementManager.moveTo(unit, target, undefined, app.engineService as PohEngine);

    // Verify unit moved
    expect(unit.tileKey.value).toBe(target.key);
    expect(unit.movement.moves.value).toBe(0);

    // Verify context cleared
    expect(current.actionMode.value).toBeUndefined();
    expect(current.object.value).toBeUndefined();
    expect(current.tile.value).toBeUndefined();
  });

  it("should refresh movement overlays with correct data", () => {
    const unit = world.unit;
    unit.movement.moves.value = 2;
    const app = useAppStore();

    const setLayerSpy = vi.fn().mockReturnThis();
    app.engineService = {
      contextOverlay: { setLayer: setLayerSpy },
      guidanceOverlay: { setLayer: setLayerSpy },
      detailOverlay: { setLayer: setLayerSpy },
      pathOverlay: { setLayer: setLayerSpy },
    } as unknown as PohEngine;

    MovementManager.refreshMovementOverlays(app.engineService as PohEngine, unit);

    // 1. Verify context overlay called for range (includes valid and danger colors)
    expect(setLayerSpy).toHaveBeenCalledWith(
      EngineLayers.movementRange,
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ colorId: "valid" }),
          expect.objectContaining({ colorId: "danger" }),
        ]),
      }),
    );

    // 2. Verify marker overlay called for costs
    expect(setLayerSpy).toHaveBeenCalledWith(
      EngineLayers.movementCosts,
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            label: expect.any(String),
            icon: "yieldType:moveCost",
            placement: "bottom",
          }),
        ]),
      }),
    );

    // 3. Verify marker overlay called for selection
    expect(setLayerSpy).toHaveBeenCalledWith(
      EngineLayers.selection,
      expect.objectContaining({
        items: [expect.objectContaining({ type: "selection", placement: "center" })],
      }),
    );
  });
});
