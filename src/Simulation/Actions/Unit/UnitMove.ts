import { IAction } from "@/Simulation/Actions/IAction";
import { Player } from "@/Common/Models/Player";
import { Tile } from "@/Common/Models/Tile";
import { Unit } from "@/Common/Models/Unit";
import { IMutation } from "@/Common/IMutation";
import { Pathfinder } from "@/Simulation/Movement/Pathfinder";
import { UnitMovement } from "@/Simulation/Movement/UnitMovement";
import { belongsToPlayer } from "@/Simulation/Validator";

export class UnitMove implements IAction {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
    private readonly toTile: Tile,
  ) {}

  validateAction() {
    belongsToPlayer(this.player, this.unit);

    if (
      new Pathfinder().findPath(this.unit, this.toTile, UnitMovement.getMoveContext(this.unit))
        .length === 0
    ) {
      throw new Error("No path to target tile");
    }
    return this;
  }

  handleAction(): IMutation[] {
    this.unit.movement.move();

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
