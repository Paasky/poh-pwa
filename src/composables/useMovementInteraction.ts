import { watch } from "vue";
import { useCurrentContext } from "@/composables/useCurrentContext";
import { useAppStore } from "@/stores/appStore";
import { MovementService } from "@/services/MovementService";
import { PathfinderService } from "@/services/PathfinderService";
import { Unit } from "@/objects/game/Unit";
import { Tile } from "@/objects/game/Tile";
import { useObjectsStore } from "@/stores/objectStore";
import { OVERLAY_LAYERS, OverlayColorId } from "@/components/Engine/overlays/OverlayConstants";
import type { GameKey } from "@/objects/game/_GameObject";

/**
 * useMovementInteraction is an orchestrator that bridges player intent
 * (from useCurrentContext) to the 3D engine visuals (Overlays).
 */
export function useMovementInteraction() {
  const current = useCurrentContext();
  const app = useAppStore();
  const objStore = useObjectsStore();

  // Watch for selection changes to update reachable areas and selection markers
  watch(
    current.object,
    (obj) => {
      const { contextOverlay, markerOverlay, pathOverlay } = app.engineService;
      if (!contextOverlay || !markerOverlay || !pathOverlay) return;

      if (obj?.class === "unit") {
        const unit = obj as unknown as Unit;
        const context = MovementService.getMoveContext(unit);
        const pathfinder = new PathfinderService();
        const reachable = pathfinder.getReachableTiles(unit, context);

        const blocked = new Set<GameKey>();
        const allConsidered = new Set([unit.tile.value.key, ...reachable]);
        for (const key of allConsidered) {
          const tile = objStore.getTiles[key];
          if (!tile) continue;
          for (const neighbor of tile.neighborTiles) {
            if (!allConsidered.has(neighbor.key)) {
              blocked.add(neighbor.key);
            }
          }
        }

        contextOverlay.setLayer(OVERLAY_LAYERS.MOVEMENT_RANGE, {
          items: Array.from(reachable).map((key) => ({
            tile: objStore.getTiles[key],
            colorId: OverlayColorId.VALID,
            alpha: 0.4,
          })),
        });

        markerOverlay.setLayer(OVERLAY_LAYERS.SELECTION, {
          items: [{ tile: unit.tile.value, type: "selection" }],
        });

        pathOverlay.setLayer(OVERLAY_LAYERS.MOVEMENT_PATH, {
          items: unit.movement.path.map((step) => ({ tile: step.tile })),
          style: { colorId: OverlayColorId.MOVE, alpha: 1, dashed: false, width: 1 },
        });
      } else {
        // Clear all movement visuals when no unit is selected
        contextOverlay.setLayer(OVERLAY_LAYERS.MOVEMENT_RANGE, null);
        markerOverlay.setLayer(OVERLAY_LAYERS.SELECTION, null);
        pathOverlay.setLayer(OVERLAY_LAYERS.MOVEMENT_PATH, null);
      }
    },
    { immediate: true },
  );

  // Watch for hover changes to update the potential path preview
  watch(current.hover, (hoverTile) => {
    const { pathOverlay } = app.engineService;
    if (!pathOverlay) return;

    const selectedObject = current.object.value;
    if (selectedObject?.class === "unit" && hoverTile) {
      const unit = selectedObject as unknown as Unit;
      const context = MovementService.getMoveContext(unit);
      const pathfinder = new PathfinderService();
      const path = pathfinder.findPath(unit, hoverTile as unknown as Tile, context);

      pathOverlay.setLayer(OVERLAY_LAYERS.MOVEMENT_PREVIEW, {
        items: path.map((step) => ({ tile: step.tile })),
        style: { colorId: OverlayColorId.MOVE, alpha: 0.5, dashed: true, width: 1 },
      });
    } else {
      pathOverlay.setLayer(OVERLAY_LAYERS.MOVEMENT_PREVIEW, null);
    }
  });
}
