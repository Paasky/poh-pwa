import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { belongsToPlayer, hasMoves, isAlive } from "@/Simulation/Validator";
import { PohMutation } from "@/Common/PohMutation";

export class UnitClear implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isAlive(this.unit);
    hasMoves(this.unit);
    // Future: check if unit can build this improvement on this tile
    return this;
  }

  handleAction(): PohMutation[] {
    return [
      {
        type: "update",
        payload: {
          key: this.unit.key,
          type: "actionType:clean",
          target: this.unit.tileKey,
        },
      },
    ];
  }
}
