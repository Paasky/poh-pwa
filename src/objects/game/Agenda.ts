import { HasPlayer } from "@/objects/game/_mixins";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";

export class Agenda extends HasPlayer(GameObject) {
  constructor(key: GameKey, playerKey: GameKey) {
    super(key);
    this.playerKey.value = playerKey;
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "playerKey", related: { theirKeyAttr: "agendaKeys" } },
  ];
}
