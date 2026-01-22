import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { Tile } from "@/Common/Models/Tile";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { belongsToPlayer, hasMoves, isAlive } from "@/Simulation/Validator";
import { PohMutation } from "@/Common/PohMutation";

export class UnitRecon implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
    private readonly tile: Tile,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isAlive(this.unit);
    hasMoves(this.unit);
    // Future: check if unit can perform recon and tile is in range
    return this;
  }

  handleAction(): PohMutation[] {
    this.unit.action = { type: "recon", target: this.tile.key };
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
