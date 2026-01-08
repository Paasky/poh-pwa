import { GameKey } from "@/Common/Models/_GameModel";
import { Player } from "@/Common/Models/Player";
import { hasOne } from "@/Common/Models/_Relations";

export class Diplomacy {
  constructor(public playerKey: GameKey) {
    hasOne<Player>(this, "playerKey");
  }

  declare player: Player;
}
