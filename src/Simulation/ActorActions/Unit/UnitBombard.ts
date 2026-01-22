import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import {
  belongsToPlayer,
  canAttack,
  hasMoves,
  isAlive,
  isInRange,
  isValidCombatTarget,
} from "@/Simulation/Validator";
import { PohMutation } from "@/Common/PohMutation";
import { City } from "@/Common/Models/City";
import { Construction } from "@/Common/Models/Construction";
import { Combat } from "@/Simulation/Combat/Combat";
import { Tile } from "@/Common/Models/Tile";
import { UnitAttack } from "@/Simulation/ActorActions/Unit/UnitAttack";

export class UnitBombard implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly unit: Unit,
    private readonly target: City | Construction | Unit,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.unit);
    isAlive(this.unit);
    canAttack(this.unit);
    hasMoves(this.unit);
    isInRange(this.unit, this.target.tile);
    isValidCombatTarget(this.unit, this.target);

    return this;
  }

  handleAction(): PohMutation[] {
    return new Combat(this.unit, this.target).bombard();
  }

  static getTileTarget(unit: Unit, tile: Tile): City | Construction | Unit | undefined {
    return UnitAttack.getTileTarget(unit, tile);
  }
}
