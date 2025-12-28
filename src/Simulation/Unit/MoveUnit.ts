import { IActionHandler } from "@/Simulation/IActionHandler";
import { Player } from "@/objects/game/Player";
import { Tile } from "@/objects/game/Tile";
import { Unit } from "@/objects/game/Unit";
import { IMutation } from "@/Common/IMutation";
import { Pathfinder } from "@/movement/Pathfinder";
import { UnitMovement } from "@/movement/UnitMovement";
import { belongsToPlayer } from "@/Simulation/Validator";

export class MoveUnit implements IActionHandler {
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
