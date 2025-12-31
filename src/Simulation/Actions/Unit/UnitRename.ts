import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { ISimAction } from "@/Simulation/Actions/ISimAction";
import { belongsToPlayer, isAlive } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";

export class UnitRename implements ISimAction {
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
