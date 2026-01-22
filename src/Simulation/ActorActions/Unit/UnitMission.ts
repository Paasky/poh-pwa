import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { belongsToPlayer, hasMoves, isAlive } from "@/Simulation/Validator";
import { PohMutation } from "@/Common/PohMutation";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { GameObject } from "@/Common/Models/_GameModel";

export class UnitMission implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
    private readonly missionType: TypeObject,
    private readonly target: GameObject | null,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isAlive(this.unit);
    hasMoves(this.unit);
    // Future: check if mission is valid for this unit and target
    return this;
  }

  handleAction(): PohMutation[] {
    this.unit.action = {
      type: "mission",
      target: this.target?.key ?? null,
    };
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
