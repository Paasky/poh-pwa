import { Player } from "@/objects/game/Player";
import { Unit } from "@/objects/game/Unit";
import { Tile } from "@/objects/game/Tile";
import { IActionHandler } from "@/Simulation/Actions/IActionHandler";
import { belongsToPlayer, hasMoves, isAlive } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";
import { City } from "@/objects/game/City";

export class Bombard implements IActionHandler {
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
