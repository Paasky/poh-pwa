import { Player } from "@/objects/game/Player";
import { Unit } from "@/objects/game/Unit";
import { IActionHandler } from "@/Simulation/Actions/IActionHandler";
import { belongsToPlayer, hasMoves, isAlive } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";

export class SettleCity implements IActionHandler {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isAlive(this.unit);
    hasMoves(this.unit);
    // Future: check if tile is valid for settling
    return this;
  }

  handleAction(): IMutation[] {
    this.unit.action = { type: "settle", target: null };
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
