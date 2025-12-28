import { subscribe } from "@/Common/ActionBus";
import { Action } from "@/Common/IAction";
import { GameKey } from "@/objects/game/_GameObject";
import { useDataBucket } from "@/Data/useDataBucket";
import { DataStore } from "@/Data/DataStore";
import { IMutation } from "@/Common/IMutation";
import { MoveUnit } from "@/Simulation/Unit/MoveUnit";
import { Player } from "@/objects/game/Player";
import { Tile } from "@/objects/game/Tile";
import { Unit } from "@/objects/game/Unit";
import { BasicUnitAction } from "@/Simulation/Unit/BasicUnitAction";

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
      case "alert":
      case "fortify":
      case "heal":
      case "rename":
      case "skip":
      case "stop":
        mutations.push(
          ...new BasicUnitAction(player, bucket.getObject<Unit>(action.unitKey), action.type)
            .validateAction()
            .handleAction(),
        );
        break;

      case "attack":
        // todo
        break;

      case "bombard":
        // todo
        break;

      case "build":
        // todo
        break;

      case "demobilize":
        // todo
        break;

      case "disband":
        // todo
        break;

      case "explore":
        // todo
        break;

      case "mission":
        // todo
        break;

      case "mobilize":
        // todo
        break;

      case "pillage":
        // todo
        break;

      case "rebase":
        // todo
        break;

      case "recon":
        // todo
        break;

      case "settle":
        // todo
        break;

      case "trade":
        // todo
        break;

      case "upgrade":
        // todo
        break;

      case "move":
        mutations.push(
          ...new MoveUnit(
            player,
            bucket.getObject<Unit>(action.unitKey),
            bucket.getObject<Tile>(action.tileKey),
          )
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
