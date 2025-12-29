import { GameKey } from "@/objects/game/_keys";
import { Player } from "@/objects/game/Player";
import { Unit } from "@/objects/game/Unit";
import { Construction } from "@/objects/game/Construction";
import { City } from "@/objects/game/City";
import { Tile } from "@/objects/game/Tile";

export const belongsToPlayer = (
  player: Player,
  object: { key: GameKey; playerKey: GameKey | null },
): void => {
  if (player.key !== object.playerKey)
    throw new Error(`${object.key} does not belong to ${player.name}`);
};
export const doesNotBelongToPlayer = (
  player: Player,
  object: { key: GameKey; playerKey: GameKey | null },
): void => {
  if (player.key === object.playerKey) throw new Error(`${object.key} belongs to ${player.name}`);
};

export const hasMoves = (unit: Unit): void => {
  if (unit.movement.moves <= 0) {
    throw new Error(`Unit ${unit.key} has no moves left`);
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
