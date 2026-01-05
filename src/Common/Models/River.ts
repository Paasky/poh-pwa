import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import type { Tile } from "@/Common/Models/Tile";

export class River extends GameObject {
  constructor(
    key: GameKey,
    public name: string,
    public tileKeys: Set<GameKey>,
  ) {
    super(key);
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
  get tiles(): Map<GameKey, Tile> {
    return this.hasMany<Tile>("tileKeys");
  }

  /*
   * Computed
   */
  // todo add here

  /*
   * Actions
   */
  // todo add here
}
