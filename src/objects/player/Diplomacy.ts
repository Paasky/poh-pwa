import { HasPlayer } from "@/objects/game/_mixins";
import { GameKey } from "@/objects/game/_GameObject";

export class Diplomacy extends HasPlayer(Object) {
  constructor(playerKey: GameKey) {
    super();
    this.playerKey.value = playerKey;
  }
}
