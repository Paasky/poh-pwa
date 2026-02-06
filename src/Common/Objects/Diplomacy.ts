import { GameKey, GameObject } from "@/Common/Models/_GameModel";
import { Player } from "@/Common/Models/Player";

export class Diplomacy extends GameObject {
  constructor(
    id: GameKey,
    public playerKey: GameKey,
  ) {
    super(id);
  }

  get player(): Player {
    return this.hasOne<Player>("player", "playerKey");
  }
}
