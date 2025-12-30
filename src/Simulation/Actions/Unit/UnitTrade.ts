import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { GameKey } from "@/Common/Models/_GameTypes";
import { IAction } from "@/Simulation/Actions/IAction";
import { belongsToPlayer, hasMoves, isAlive } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";

export class UnitTrade implements IAction {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
    private readonly target: { key: GameKey },
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isAlive(this.unit);
    hasMoves(this.unit);
    // Future: check if unit can trade and target is in range
    return this;
  }

  handleAction(): IMutation[] {
    this.unit.action = { type: "trade", target: this.target.key };
    return [
      {
        type: "update",
        payload: {
          key: this.unit.key,
          action: this.unit.action,
        },
      },
    ];
  }
}
