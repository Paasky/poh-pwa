import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import type { Tile } from "@/Common/Models/Tile";
import { hasMany } from "@/Common/Models/_Relations";

export class River extends GameObject {
  constructor(
    key: GameKey,
    public name: string,
    public tileKeys: Set<GameKey>,
  ) {
    super(key);

    hasMany<Tile>(this, "tileKeys");
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "name" },
    {
      attrName: "tileKeys",
      related: { theirKeyAttr: "riverKey", isOne: true, isManyToMany: true },
    },
  ];

  /*
   * Attributes
   */

  /*
   * Relations
   */
  declare tiles: Tile[];

  /*
   * Computed
   */
  // todo add here

  /*
   * Actions
   */
  // todo add here
}
