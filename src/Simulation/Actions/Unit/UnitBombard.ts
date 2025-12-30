import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { Tile } from "@/Common/Models/Tile";
import { IAction } from "@/Simulation/Actions/IAction";
import { belongsToPlayer, hasMoves, isAlive } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";
import { City } from "@/Common/Models/City";

export class UnitBombard implements IAction {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
    private readonly target: City | Tile | Unit,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isAlive(this.unit);
    hasMoves(this.unit);
    // Future: check if unit has bombard capability and tile is in range
    return this;
  }

  handleAction(): IMutation[] {
    this.unit.action = { type: "bombard", target: this.target.key };
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
