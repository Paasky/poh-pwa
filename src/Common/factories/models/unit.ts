import { generateKey, type GameKey } from "@/Common/Models/_GameModel";
import { Unit } from "@/Common/Models/Unit";

export type CreateUnitOptions = {
  key?: GameKey;
  designKey: GameKey;
  playerKey: GameKey;
  tileKey: GameKey;
  cityKey?: GameKey | null;
  customName?: string;
  canAttack?: boolean;
  health?: number;
  moves?: number;
};

export function createUnit(options: CreateUnitOptions): Unit {
  const {
    designKey,
    playerKey,
    tileKey,
    cityKey = null,
    customName = "",
    canAttack = false,
    health = 100,
    moves = 0,
  } = options;

  const key = options.key ?? generateKey("unit");

  return new Unit(
    key,
    designKey,
    playerKey,
    tileKey,
    cityKey,
    customName,
    null,
    canAttack,
    health,
    moves,
  );
}
