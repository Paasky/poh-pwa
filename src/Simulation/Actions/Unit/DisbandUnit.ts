import { Player } from "@/objects/game/Player";
import { Unit } from "@/objects/game/Unit";
import { IActionHandler } from "@/Simulation/Actions/IActionHandler";
import { belongsToPlayer, isAlive } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";

export class DisbandUnit implements IActionHandler {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isAlive(this.unit);
    // Disband typically doesn't require moves, but if it does:
    // hasMoves(this.unit);
    return this;
  }

  handleAction(): IMutation[] {
    return [
      {
        type: "remove",
        payload: {
          key: this.unit.key,
        },
      },
    ];
  }
}
