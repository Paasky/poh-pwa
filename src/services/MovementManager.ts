import { Unit } from "@/objects/game/Unit";
import { Tile } from "@/objects/game/Tile";
import { MovementService } from "@/services/MovementService";
import { PathfinderService } from "@/services/PathfinderService";
import { useCurrentContext } from "@/composables/useCurrentContext";

/**
 * MovementManager handles high-level movement execution for both Players and AI.
 * It separates game logic from UI orchestration.
 */
export class MovementManager {
  /**
   * Generates a path and executes movement for a unit towards a target tile.
   */
  static moveTo(unit: Unit, target: Tile): void {
    const context = MovementService.getMoveContext(unit);
    const pathfinder = new PathfinderService();
    const path = pathfinder.findPath(unit, target, context);

    if (path.length > 0) {
      unit.movement.path = path;
      unit.movement.move(context);
    }

    const current = useCurrentContext();
    current.actionMode.value = undefined;
    // Selection persists so player can see updated moves/status
  }
}
