import { Player } from "@/objects/game/Player";
import { Unit } from "@/objects/game/Unit";
import { IActionHandler } from "@/Simulation/Actions/IActionHandler";
import { belongsToPlayer, hasMoves, isAlive } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";
import { TypeObject } from "@/types/typeObjects";
import { GameObject } from "@/objects/game/_GameObject";

export class UnitMission implements IActionHandler {
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

  handleAction(): IMutation[] {
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
