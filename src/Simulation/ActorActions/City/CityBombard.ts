import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { Player } from "@/Common/Models/Player";
import { City } from "@/Common/Models/City";
import { PohMutation } from "@/Common/PohMutation";
import {
  belongsToPlayer,
  canAttack,
  isAlive,
  isInRange,
  isValidCombatTarget,
} from "@/Simulation/Validator";
import { Construction } from "@/Common/Models/Construction";
import { Unit } from "@/Common/Models/Unit";
import { Combat } from "@/Simulation/Combat/Combat";
import { Tile } from "@/Common/Models/Tile";

export class CityBombard implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly city: City,
    private readonly target: City | Construction | Unit,
  ) {}

  validateAction(): this {
    belongsToPlayer(this.player, this.city);
    isAlive(this.city);
    canAttack(this.city);
    isInRange(this.city, this.target.tile);
    isValidCombatTarget(this.city, this.target);

    return this;
  }

  handleAction(): PohMutation[] {
    return new Combat(this.city, this.target).bombard();
  }

  static getTileTarget(city: City, tile: Tile): City | Construction | Unit | undefined {
    return tile.targets(city.player, city)[0];
  }
}
