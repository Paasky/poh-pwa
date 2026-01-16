import { subscribeToActions } from "@/Common/Buses/ActionBus";
import { IAction } from "@/Common/IAction";
import { GameKey } from "@/Common/Models/_GameModel";
import { useDataBucket } from "@/Data/useDataBucket";
import { DataStore } from "@/Data/DataStore";
import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { getUnitAction, UnitActionKeys } from "@/Simulation/ActorActions/UnitActionRegistry";
import { getPlayerAction, PlayerActionKeys } from "@/Simulation/ActorActions/PlayerActionRegistry";
import { CityActionKeys, getCityAction } from "@/Simulation/ActorActions/CityActionRegistry";
import { City } from "@/Common/Models/City";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { Construction } from "@/Common/Models/Construction";
import { Tile } from "@/Common/Models/Tile";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { Citizen } from "@/Common/Models/Citizen";

export class Simulation {
  private readonly dataStore: DataStore;

  constructor() {
    this.dataStore = new DataStore();
    subscribeToActions(this.onAction.bind(this));
  }

  /**
   * Main entry point for performing player actions.
   */
  onAction(playerKey: GameKey, action: IAction) {
    const bucket = useDataBucket();

    // 1. Conflict Resolution (Optimistic Locking)
    // If the client's world state is behind, the action might be invalid.
    if (action.turn !== bucket.world.turn) {
      throw new Error(
        `Action rejected: turn mismatch (action: ${action.turn}, world: ${bucket.world.turn})`,
      );
    }

    const player = bucket.getObject<Player>(playerKey);

    // 2. & 3. Validation & Mutation Generation
    let simAction = null as ISimAction | null;
    switch (true) {
      // City Actions
      case CityActionKeys.has(action.type):
        if (!action.cityKey) {
          throw new Error(`No city key given for action: ${action.type}`);
        }
        simAction = getCityAction(
          action.type,
          player,
          useDataBucket().getObject<City>(action.cityKey),
          {
            citizen: action.citizenKey ? bucket.getObject<Citizen>(action.citizenKey) : undefined,
            design: action.designKey ? bucket.getObject<UnitDesign>(action.designKey) : undefined,
            index: action.index,
            toIndex: action.toIndex,
            name: action.name,
            target: action.targetKey
              ? bucket.getObject<City | Construction | Tile | Unit>(action.targetKey)
              : undefined,
            tile: action.tileKey ? bucket.getObject<Tile>(action.tileKey) : undefined,
            type: action.typeKey ? bucket.getType(action.typeKey) : undefined,
          },
        );
        break;

      // Actor Actions
      case PlayerActionKeys.has(action.type):
        simAction = getPlayerAction(action.type, player, {
          type: action.typeKey ? bucket.getType(action.typeKey) : undefined,
        });
        break;

      // Unit Actions
      case UnitActionKeys.has(action.type):
        if (!action.unitKey) {
          throw new Error(`No unit key given for action: ${action.type}`);
        }
        simAction = getUnitAction(action.type, player, bucket.getObject<Unit>(action.unitKey), {
          name: action.name,
          target: action.targetKey
            ? bucket.getObject<City | Construction | Tile | Unit>(action.targetKey)
            : undefined,
          type: action.typeKey ? bucket.getType(action.typeKey) : undefined,
        });
        break;

      default:
        throw new Error(`Invalid action type: ${action.type}`);
    }

    // 4. Execution
    const mutations = simAction.validateAction().handleAction();
    if (mutations.length > 0) {
      this.dataStore.set(mutations);
    }
  }
}
