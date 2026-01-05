import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { ISimAction } from "@/Simulation/Actions/ISimAction";
import { belongsToPlayer, hasMoves, isAlive } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";

export class UnitClean implements ISimAction {
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

  handleAction(): IMutation[] {
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
