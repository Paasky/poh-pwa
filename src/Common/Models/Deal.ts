import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import type { Player } from "@/Common/Models/Player";
import { hasOne } from "@/Common/Models/_Relations";
import { Yields } from "@/Common/Objects/Yields";

export class Deal extends GameObject {
  constructor(
    key: GameKey,
    public fromPlayerKey: GameKey,
    public toPlayerKey: GameKey,
  ) {
    super(key);
    hasOne<Player>(this, "fromPlayerKey");
    hasOne<Player>(this, "toPlayerKey");
  }

  static attrsConf: GameObjAttr[] = [
    {
      attrName: "fromPlayerKey",
      related: { theirKeyAttr: "dealKeys" },
    },
    {
      attrName: "toPlayerKey",
      related: { theirKeyAttr: "dealKeys" },
    },
  ];

  /*
   * Attributes
   */
  // todo add here

  /*
   * Relations
   */
  declare fromPlayer: Player;

  declare toPlayer: Player;

  /*
   * Computed
   */

  get yields(): Yields {
    return new Yields([]);
  }

  /*
   * Actions
   */
  // todo add here
}
