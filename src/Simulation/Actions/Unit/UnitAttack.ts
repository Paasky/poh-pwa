import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { IAction } from "@/Simulation/Actions/IAction";
import { belongsToPlayer, isValidCombatTarget } from "@/Simulation/Validator";
import { IMutation } from "@/Common/IMutation";
import { City } from "@/Common/Models/City";
import { Combat } from "@/Simulation/Combat/Combat";
import { Construction } from "@/Common/Models/Construction";
import { Tile } from "@/Common/Models/Tile";

export class UnitAttack implements IAction {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
    private readonly target: City | Construction | Unit,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isValidCombatTarget(this.unit, this.target);
    return this;
  }

  handleAction(): IMutation[] {
    return new Combat(this.unit, this.target).melee();
  }

  static getTileTarget(unit: Unit, tile: Tile): City | Construction | Unit | undefined {
    if (!tile.city && !tile.construction && !tile.units.length) {
      return undefined;
    }
    return tile.targets(unit.player, unit)[0];
  }
}
