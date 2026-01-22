import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { ActionType } from "@/Common/PohAction";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { belongsToPlayer, isInRange } from "@/Simulation/Validator";
import { PohMutation } from "@/Common/PohMutation";
import { Tile } from "@/Common/Models/Tile";

export class UnitTileAction implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
    private readonly actionType: ActionType,
    private readonly tile: Tile,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isInRange(this.unit, this.tile);

    return this;
  }

  handleAction(): PohMutation[] {
    return [
      {
        type: "update",
        payload: {
          key: this.unit.key,
          action: {
            type: this.actionType,
            target: this.tile.key,
          },
        },
      },
    ];
  }
}
