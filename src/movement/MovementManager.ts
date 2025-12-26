import { Unit } from "@/objects/game/Unit";
import { Tile } from "@/objects/game/Tile";
import { UnitMovement } from "@/movement/UnitMovement";
import { Pathfinder } from "@/movement/Pathfinder";
import { useCurrentContext } from "@/composables/useCurrentContext";
import { useAppStore } from "@/stores/appStore";
import { EngineAlpha, EngineLayers, EnginePathStyles } from "@/engine/EngineStyles";

/**
 * MovementManager handles high-level movement execution for both Players and AI.
 * It separates game logic from UI orchestration.
 */
export class MovementManager {
  /**
   * Generates a path and executes movement for a unit towards a target tile.
   */
  static moveTo(unit: Unit, target: Tile): void {
    const context = UnitMovement.getMoveContext(unit);
    const pathfinder = new Pathfinder();
    const path = pathfinder.findPath(unit, target, context);

    if (path.length > 0) {
      unit.movement.path = path;
      unit.movement.move(context);
    }

    const current = useCurrentContext();
    if (current.object.value?.key === unit.key) {
      // If the player ordered the move and unit is out of moves, remove current context
      if (unit.movement.moves.value <= 0) {
        current.actionMode.value = undefined;
        current.object.value = undefined;
        current.tile.value = undefined;
      } else {
        // Unit can still move, so just update to the new tile (better UX for carefully moving a unit)
        current.tile.value = target;
      }

      // Refresh or clear visuals
      if (unit.movement.moves.value <= 0) {
        this.clearMovementOverlays();
      } else {
        this.refreshMovementOverlays(unit);
      }
    }
  }

  /**
   * Refreshes the movement range, selection marker, and current path overlays.
   */
  static refreshMovementOverlays(unit: Unit): void {
    const app = useAppStore();
    if (!Object.keys(app.engineService ?? {}).length) return;

    const { contextOverlay, guidanceOverlay, detailOverlay, pathOverlay } = app.engineService;
    const context = UnitMovement.getMoveContext(unit);
    const pathfinder = new Pathfinder();

    const rangeData = pathfinder.getTilesInRange(unit, context);

    contextOverlay.setLayer(EngineLayers.movementRange, {
      items: Array.from(rangeData.values()).map(({ tile, cost }) => ({
        tile,
        colorId: cost !== null ? "valid" : "danger",
        alpha: EngineAlpha.movementRange,
      })),
    });

    detailOverlay.setLayer(EngineLayers.movementCosts, {
      items: Array.from(rangeData.values())
        .filter((item) => item.cost !== null)
        .map(({ tile, cost }) => ({
          tile,
          label: cost === "turnEnd" ? "End" : cost!.toString(),
          icon: "yieldType:moveCost",
          placement: "bottom",
        })),
    });

    guidanceOverlay.setLayer(EngineLayers.selection, {
      items: [{ tile: unit.tile.value, type: "selection", placement: "center" }],
    });

    pathOverlay.setLayer(EngineLayers.movementPath, {
      items: [
        { tile: unit.tile.value },
        ...unit.movement.path.map((step) => ({ tile: step.tile })),
      ],
      style: {
        colorId: "move",
        alpha: EngineAlpha.movementPath,
        ...EnginePathStyles.movementPath,
      },
    });

    pathOverlay.setLayer(EngineLayers.movementPreview, null);
  }

  /**
   * Clears all movement-related overlays.
   */
  static clearMovementOverlays(): void {
    const app = useAppStore();
    if (!Object.keys(app.engineService ?? {}).length) return;

    const { contextOverlay, guidanceOverlay, detailOverlay, pathOverlay } = app.engineService;

    contextOverlay.setLayer(EngineLayers.movementRange, null);
    guidanceOverlay.setLayer(EngineLayers.selection, null);
    detailOverlay.setLayer(EngineLayers.movementCosts, null);
    pathOverlay.setLayer(EngineLayers.movementPath, null);
    pathOverlay.setLayer(EngineLayers.movementPreview, null);
  }
}
