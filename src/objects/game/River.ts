import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";

export class River extends GameObject {
  constructor(key: GameKey, name: string, tileKeys: GameKey[]) {
    super(key);
    this.name = name;
    this.tileKeys = tileKeys;
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "name", attrNotRef: true },
    {
      attrName: "tileKeys",
      attrNotRef: true,
      related: { theirKeyAttr: "riverKey", isOne: true },
    },
  ];

  tileKeys: GameKey[];

  name: string;
}
