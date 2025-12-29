import { Player } from "@/objects/game/Player";
import { Unit } from "@/objects/game/Unit";
import { IActionHandler } from "@/Simulation/Actions/IActionHandler";
import { belongsToPlayer, isAlive } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";

export class RenameUnit implements IActionHandler {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
    private readonly name: string,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isAlive(this.unit);
    return this;
  }

  handleAction(): IMutation[] {
    this.unit.customName = this.name;
    return [
      {
        type: "update",
        payload: {
          key: this.unit.key,
          customName: this.unit.customName,
        },
      },
    ];
  }
}
