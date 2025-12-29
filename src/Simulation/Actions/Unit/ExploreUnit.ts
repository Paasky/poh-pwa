import { Player } from "@/objects/game/Player";
import { Unit } from "@/objects/game/Unit";
import { IActionHandler } from "@/Simulation/Actions/IActionHandler";
import { belongsToPlayer, isAlive } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";

export class ExploreUnit implements IActionHandler {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isAlive(this.unit);
    // explore might not need hasMoves immediately if it's setting an automated state
    return this;
  }

  handleAction(): IMutation[] {
    this.unit.action = { type: "explore", target: null };
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
