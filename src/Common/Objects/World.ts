import { GameKey } from "@/Common/Models/_GameModel";
import { Coords } from "@/Common/Helpers/mapTools";

export type WorldState = {
  id: string;
  size: Coords;
  turn: number;
  year: number;
  currentPlayerKey?: GameKey;
  seed?: string | number;
};
