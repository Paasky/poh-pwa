import { GameKey } from "@/objects/game/_GameObject";
import { Player } from "@/objects/game/Player";
import { hasOne } from "@/objects/game/_relations";

export class Diplomacy {
  constructor(public playerKey: GameKey) {
    hasOne<Player>(this, "playerKey");
  }

  declare player: Player;

  startTurn(): void {
    //
  }
}
