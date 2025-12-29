import { subscribe } from "@/Common/ActionBus";
import { Action } from "@/Common/IAction";
import { GameKey } from "@/objects/game/_GameObject";
import { useDataBucket } from "@/Data/useDataBucket";
import { DataStore } from "@/Data/DataStore";
import { IMutation } from "@/Common/IMutation";
import { Player } from "@/objects/game/Player";
import { Unit } from "@/objects/game/Unit";
import { getUnitAction } from "@/Simulation/Actions/UnitActionRegistry";

export class Simulation {
  private readonly dataStore: DataStore;

  constructor() {
    this.dataStore = new DataStore();
    subscribe(this.onAction.bind(this));
  }

  /**
   * Main entry point for performing player actions.
   *
   * Workflow:
   * 1. Conflict Resolution: Check if action.version matches current world.turn
   * 2. Validation: Ensure the action is legal given the current state
   * 3. Transformation: Convert high-level IAction into low-level IMutation[]
   * 4. Execution: Apply mutations via DataStore
   *
   * @example
   * // Inside a specific action handler:
   * if (action.type === 'move') {
   *   const unit = dataBucket.getObject<Unit>(action.unitKey);
   *   if (unit.playerKey !== playerKey) throw new Error("Not your unit");
   *   // ... more validation
   *   const mutations: IMutation[] = [{
   *     type: 'update',
   *     payload: { key: unit.key, tileKey: action.tileKey, moves: unit.moves + 1 }
   *   }];
   *   this.dataStore.set(mutations);
   * }
   */
  onAction(playerKey: GameKey, action: Action) {
    const bucket = useDataBucket();

    // 1. Conflict Resolution (Optimistic Locking)
    // If the client's world state is behind, the action might be invalid.
    if (action.turn !== bucket.world.turn) {
      throw new Error(
        `Action rejected: turn mismatch (action: ${action.turn}, world: ${bucket.world.turn})`,
      );
    }

    const player = bucket.getObject<Player>(playerKey);
    const mutations: IMutation[] = [];

    // 2. & 3. Validation & Mutation Generation
    switch (action.type) {
      // Unit Actions
      case "alert":
      case "attack":
      case "bombard":
      case "build":
      case "demobilize":
      case "disband":
      case "explore":
      case "fortify":
      case "heal":
      case "mission":
      case "mobilize":
      case "move":
      case "pillage":
      case "rebase":
      case "recon":
      case "rename":
      case "settle":
      case "skip":
      case "stop":
      case "trade":
      case "upgrade":
        mutations.push(
          ...getUnitAction(action.type, player, bucket.getObject<Unit>(action.unitKey), {
            name: "name" in action ? action.name : undefined,
            target: "targetKey" in action ? bucket.getObject(action.targetKey) : undefined,
            type: "typeKey" in action ? bucket.getType(action.typeKey) : undefined,
          })
            .validateAction()
            .handleAction(),
        );
        break;

      default:
        throw new Error(`Invalid action type: ${action.type}`);
    }

    // 4. Execution
    if (mutations.length > 0) {
      this.dataStore.set(mutations);
    }
  }
}
