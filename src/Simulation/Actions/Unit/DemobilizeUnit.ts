import { Player } from "@/objects/game/Player";
import { Unit } from "@/objects/game/Unit";
import { IActionHandler } from "@/Simulation/Actions/IActionHandler";
import { belongsToPlayer, hasMoves, isAlive } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";

export class DemobilizeUnit implements IActionHandler {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isAlive(this.unit);
    hasMoves(this.unit);
    // Future: check if unit status allows demobilization
    return this;
  }

  handleAction(): IMutation[] {
    this.unit.action = { type: "demobilize", target: null };
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
