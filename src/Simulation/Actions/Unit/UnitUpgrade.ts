import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { ISimAction } from "@/Simulation/Actions/ISimAction";
import { belongsToPlayer, hasMoves, hasUnitDesign, isAlive } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";

export class UnitUpgrade implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
    private readonly design: UnitDesign,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isAlive(this.unit);
    hasMoves(this.unit);
    hasUnitDesign(this.player, this.design.key);
    // Future: check if unit can upgrade to this design and player has gold
    return this;
  }

  handleAction(): IMutation[] {
    this.unit.action = { type: "upgrade", target: this.design.key };
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
