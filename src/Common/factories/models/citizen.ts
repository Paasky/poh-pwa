import { generateKey, type GameKey } from "@/Common/Models/_GameModel";
import { Citizen } from "@/Common/Models/Citizen";

export type CreateCitizenOptions = {
  key?: GameKey;
  cityKey: GameKey;
  cultureKey: GameKey;
  playerKey: GameKey;
  tileKey: GameKey;
  religionKey?: GameKey | null;
};

export function createCitizen(options: CreateCitizenOptions): Citizen {
  const { cityKey, cultureKey, playerKey, tileKey, religionKey = null } = options;

  const key = options.key ?? generateKey("citizen");

  return new Citizen(key, cityKey, cultureKey, playerKey, tileKey, religionKey);
}
