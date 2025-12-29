import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import type { Player } from "@/Common/Models/Player";
import { hasOne } from "@/Common/Models/_Relations";

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
