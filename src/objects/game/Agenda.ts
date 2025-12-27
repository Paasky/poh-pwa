import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import type { Player } from "@/objects/game/Player";
import { hasOne } from "@/objects/game/_relations";

export class Agenda extends GameObject {
  constructor(
    key: GameKey,
    public playerKey: GameKey,
  ) {
    super(key);

    hasOne<Player>(this, "playerKey");
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "playerKey", related: { theirKeyAttr: "agendaKeys" } },
  ];

  /*
   * Attributes
   */
  // todo add here

  /*
   * Relations
   */
  declare player: Player;

  /*
   * Computed
   */
  // todo add here

  /*
   * Actions
   */
  // todo add here
}
