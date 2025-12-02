import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { ComputedRef } from "vue";
import type { Tile } from "@/objects/game/Tile";
import { hasMany } from "@/objects/game/_relations";

export class River extends GameObject {
  constructor(key: GameKey, name: string, tileKeys: GameKey[]) {
    super(key);

    this.name = name;

    this.tileKeys = tileKeys;
    this.tiles = hasMany<Tile>(this.tileKeys, `${this.key}.tiles`);
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "name", attrNotRef: true },
    {
      attrName: "tileKeys",
      attrNotRef: true,
      related: { theirKeyAttr: "riverKey", isOne: true },
    },
  ];

  /*
   * Attributes
   */
  name: string;

  /*
   * Relations
   */
  tileKeys: GameKey[];
  tiles: ComputedRef<Tile[]>;

  /*
   * Computed
   */
  // todo add here

  /*
   * Actions
   */
  // todo add here
}
