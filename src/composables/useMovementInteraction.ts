import { watch } from "vue";
import { useCurrentContext } from "@/composables/useCurrentContext";
import { useAppStore } from "@/stores/appStore";
import { MovementService } from "@/services/MovementService";
import { PathfinderService } from "@/services/PathfinderService";
import { Unit } from "@/objects/game/Unit";
import { useObjectsStore } from "@/stores/objectStore";

/**
 * useMovementInteraction is an orchestrator that bridges player intent
 * (from useCurrentContext) to the 3D engine visuals (MovementOverlay).
 */
export function useMovementInteraction() {
  const current = useCurrentContext();
  const app = useAppStore();
  const objStore = useObjectsStore();

  // Watch for selection changes to update reachable areas and selection markers
  watch(
    current.object,
    (obj) => {
      const overlay = app.engineService.movementOverlay;
      if (!overlay) return;

      if (obj?.class === "unit") {
        const unit = obj as Unit;
        const context = MovementService.getMoveContext(unit);
        const pathfinder = new PathfinderService();
        const reachable = pathfinder.getReachableTiles(unit, context);

        const blocked = new Set<GameKey>();
        const allConsidered = new Set([unit.tile.value.key, ...reachable]);
        for (const key of allConsidered) {
          const tile = objStore.getTiles[key];
          if (!tile) continue;
          for (const neighbor of tile.neighborTiles()) {
            if (!allConsidered.has(neighbor.key)) {
              blocked.add(neighbor.key);
            }
          }
        }

        overlay.setReachableTiles(reachable, blocked, objStore.getTiles);
        overlay.setSelectionMarker(unit.tile.value);
        overlay.setCurrentPath(unit.movement.path, unit.tile.value);
      } else {
        // Clear all movement visuals when no unit is selected
        overlay.clear();
        overlay.setSelectionMarker(undefined);
      }
    },
    { immediate: true },
  );

  // Watch for hover changes to update the potential path preview
  watch(current.hover, (hoverTile) => {
    const overlay = app.engineService.movementOverlay;
    if (!overlay) return;

    const selectedObject = current.object.value;
    if (selectedObject?.class === "unit" && hoverTile) {
      const unit = selectedObject as Unit;
      const context = MovementService.getMoveContext(unit);
      const pathfinder = new PathfinderService();
      const path = pathfinder.findPath(unit, hoverTile, context);

      overlay.setPotentialPath(path, unit.tile.value);
    } else {
      overlay.setPotentialPath([]);
    }
  });
}
