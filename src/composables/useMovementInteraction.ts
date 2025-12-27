import { watch } from "vue";
import { useCurrentContext } from "@/composables/useCurrentContext";
import { useAppStore } from "@/stores/appStore";
import { MovementManager } from "@/movement/MovementManager";
import { UnitMovement } from "@/movement/UnitMovement";
import { Pathfinder } from "@/movement/Pathfinder";
import { Tile } from "@/objects/game/Tile";
import { EngineAlpha, EngineLayers, EnginePathStyles } from "@/engine/EngineStyles";
import { Unit } from "@/objects/game/Unit";
import { PohEngine } from "@/engine/PohEngine";

/**
 * useMovementInteraction is an orchestrator that bridges player intent
 * (from useCurrentContext) to the 3D engine visuals (Overlays).
 */
export function useMovementInteraction() {
  const current = useCurrentContext();
  const app = useAppStore();

  // Watch for selection changes to update reachable areas and selection markers
  watch(
    current.object,
    (obj) => {
      if (obj?.class === "unit") {
        MovementManager.refreshMovementOverlays(
          app.engineService as PohEngine,
          obj as unknown as Unit,
        );
      } else {
        // Clear all movement visuals when no unit is selected
        MovementManager.clearMovementOverlays(app.engineService as PohEngine);
      }
    },
    { immediate: true },
  );

  // Watch for hover changes to update the potential path preview
  watch(current.hover, (hoverTile) => {
    const { pathOverlay } = app.engineService;

    const selectedObject = current.object;
    if (selectedObject?.class === "unit" && hoverTile) {
      const unit = selectedObject as unknown as Unit;
      const context = UnitMovement.getMoveContext(unit);
      const pathfinder = new Pathfinder();
      const path = pathfinder.findPath(unit, hoverTile as unknown as Tile, context);

      pathOverlay.setLayer(EngineLayers.movementPreview, {
        items: [{ tile: unit.tile.value }, ...path.map((step) => ({ tile: step.tile }))],
        style: {
          colorId: "move",
          alpha: EngineAlpha.movementPreview,
          ...EnginePathStyles.movementPreview,
        },
      });
    } else {
      pathOverlay.setLayer(EngineLayers.movementPreview, null);
    }
  });
}
