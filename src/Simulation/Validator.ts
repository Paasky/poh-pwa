import { GameKey } from "@/Common/Models/_GameTypes";
import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";
import { Construction } from "@/Common/Models/Construction";
import { City } from "@/Common/Models/City";
import { Tile } from "@/Common/Models/Tile";
import { Yields } from "@/Common/Objects/Yields";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { UnitDesign } from "@/Common/Models/UnitDesign";

export const belongsToCity = (
  city: City,
  object: { key: GameKey; cityKey: GameKey | null },
): void => {
  if (city.key !== object.cityKey) throw new Error(`${object.key} does not belong to ${city.name}`);
};

export const belongsToPlayer = (
  player: Player,
  object: { key: GameKey; playerKey: GameKey | null },
): void => {
  if (player.key !== object.playerKey) throw new Error(`Does not belong to ${player.name}`);
};

export const canAttack = (object: { canAttack: boolean }): void => {
  if (!object.canAttack) throw new Error("Cannot attack");
};

export const canStartAction(
  unit: Unit
): void => {
  if (!unit.design.platform.)
}

export const doesNotBelongToPlayer = (
  player: Player,
  object: { key: GameKey; playerKey: GameKey | null },
): void => {
  if (player.key === object.playerKey) throw new Error(`Belongs to ${player.name}`);
};

export const hasMoves = (unit: Unit): void => {
  if (unit.movement.moves <= 0) {
    throw new Error("No moves left");
  }
};

export const isInRange = (
  object: { tile: Tile; types: Set<TypeObject>; yields: Yields },
  tile: Tile,
): void => {
  const range = object.yields
    .flatten(["yieldType:range"], [...object.types, ...object.tile.types], tile.types)
    .getLumpAmount("yieldType:range");
  if (range < object.tile.distanceTo(tile)) {
    throw new Error(`Tile ${tile.key} is out of range`);
  }
};

export const isAlive = (target: City | Construction | Unit): void => {
  if (target.health <= 0) {
    throw new Error(`${target.key} is dead`);
  }
};

export const isValidCombatTarget = (
  attacker: City | Unit,
  target: City | Construction | Tile | Unit,
): void => {
  switch (target.class) {
    case "city": {
      const city = target as City;
      doesNotBelongToPlayer(attacker.player, city);
      isAlive(city);
      break;
    }
    case "construction": {
      const construction = target as Construction;
      doesNotBelongToPlayer(attacker.player, construction.tile);
      isAlive(construction);
      break;
    }
    case "tile": {
      const tile = target as Tile;
      if (!tile.city && !tile.construction && !tile.units.length) {
        throw new Error(`Tile ${tile.key} is not a valid combat target`);
      }
      const actualTarget = tile.targets(
        attacker.player,
        attacker instanceof Unit ? attacker : undefined,
      )[0];
      if (!actualTarget) {
        throw new Error(`Tile ${tile.key} is not a valid combat target`);
      }
      isAlive(actualTarget);
      break;
    }
    case "unit": {
      const unit = target as Unit;
      doesNotBelongToPlayer(attacker.player, unit);
      isAlive(unit);
      break;
    }
    default:
      throw new Error(`Target ${target.key} is not a valid combat target`);
  }
};

export const hasUnitDesign = (player: Player, designKey: GameKey): void => {
  if (!player.designKeys.has(designKey)) {
    throw new Error(`Player ${player.name} does not have unit design ${designKey}`);
  }
};
