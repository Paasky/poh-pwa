import { watch } from "vue";
import { useCurrentContext } from "@/composables/useCurrentContext";
import { useAppStore } from "@/stores/appStore";
import { MovementManager } from "@/services/MovementManager";
import { MovementService } from "@/services/MovementService";
import { PathfinderService } from "@/services/PathfinderService";
import { Tile } from "@/objects/game/Tile";
import { EngineAlpha, EngineLayers, EnginePathStyles } from "@/components/Engine/EngineStyles";
import { Unit } from "@/objects/game/Unit";

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
        MovementManager.refreshMovementOverlays(obj as unknown as Unit);
      } else {
        // Clear all movement visuals when no unit is selected
        MovementManager.clearMovementOverlays();
      }
    },
    { immediate: true },
  );

  // Watch for hover changes to update the potential path preview
  watch(current.hover, (hoverTile) => {
    const { pathOverlay } = app.engineService;

    const selectedObject = current.object.value;
    if (selectedObject?.class === "unit" && hoverTile) {
      const unit = selectedObject as unknown as Unit;
      const context = MovementService.getMoveContext(unit);
      const pathfinder = new PathfinderService();
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
