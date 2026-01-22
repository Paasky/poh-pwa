import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { belongsToPlayer, hasMoves, isAlive } from "@/Simulation/Validator";
import { PohMutation } from "@/Common/PohMutation";

export class UnitBuild implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
    private readonly improvementType: TypeObject,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isAlive(this.unit);
    hasMoves(this.unit);
    // Future: check if unit can build this improvement on this tile
    return this;
  }

  handleAction(): PohMutation[] {
    this.unit.action = { type: "build", target: this.improvementType.key };
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
