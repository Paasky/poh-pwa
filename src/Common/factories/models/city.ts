import { generateKey, type GameKey } from "@/Common/Models/_GameModel";
import { City } from "@/Common/Models/City";

export type CreateCityOptions = {
  key?: GameKey;
  playerKey: GameKey;
  tileKey: GameKey;
  name?: string;
  canAttack?: boolean;
  health?: number;
  isCapital?: boolean;
  origPlayerKey?: GameKey;
};

export function createCity(options: CreateCityOptions): City {
  const {
    playerKey,
    tileKey,
    name = "Test City",
    canAttack = false,
    health = 100,
    isCapital = false,
  } = options;

  const key = options.key ?? generateKey("city");
  const origPlayerKey = options.origPlayerKey ?? playerKey;

  return new City(key, playerKey, tileKey, name, canAttack, health, isCapital, origPlayerKey);
}
