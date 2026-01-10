import { GameKey, GameObject } from "@/Common/Models/_GameModel";
import { Player } from "@/Common/Models/Player";
import { hasOne } from "@/Common/Models/_Relations";

export class Diplomacy extends GameObject {
  constructor(
    id: GameKey,
    public playerKey: GameKey,
  ) {
    super(id);
    hasOne<Player>(this, "playerKey");
  }

  declare player: Player;
}
