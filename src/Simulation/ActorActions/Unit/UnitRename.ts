import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { belongsToPlayer, isAlive } from "@/Simulation/Validator";
import { PohMutation } from "@/Common/PohMutation";

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

  handleAction(): PohMutation[] {
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
