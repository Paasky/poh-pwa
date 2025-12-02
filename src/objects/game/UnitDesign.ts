import { ref } from "vue";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { Yields } from "@/objects/yield";
import { TypeObject } from "@/types/typeObjects";
import { canHaveOne, hasMany } from "@/objects/game/_relations";
import type { Player } from "@/objects/game/Player";
import type { Unit } from "@/objects/game/Unit";

export class UnitDesign extends GameObject {
  constructor(
    key: GameKey,
    platform: TypeObject,
    equipment: TypeObject,
    name: string,
    playerKey?: GameKey,
    isElite?: boolean,
    isActive?: boolean,
  ) {
    super(key);

    this.isActive.value = isActive ?? true;
    this.isElite = !!isElite;
    this.equipment = equipment;
    this.name = name;
    this.platform = platform;
    this.types = [this.platform, this.equipment];
    this.yields = new Yields(this.types.flatMap((t) => t.yields.all()));
    this.productionCost = this.yields.applyMods().getLumpAmount("yieldType:productionCost");

    if (playerKey) this.playerKey = playerKey;
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "platform", attrNotRef: true, isTypeObj: true },
    { attrName: "equipment", attrNotRef: true, isTypeObj: true },
    { attrName: "name", attrNotRef: true },
    {
      attrName: "playerKey",
      isOptional: true,
      attrNotRef: true,
      related: { theirKeyAttr: "designKeys" },
    },
    { attrName: "isElite", attrNotRef: true, isOptional: true },
    { attrName: "isActive", isOptional: true },
  ];

  /*
   * Attributes
   */
  equipment: TypeObject;
  isActive = ref(true);
  isElite: boolean;
  name: string;
  platform: TypeObject;
  productionCost: number;
  types: TypeObject[];
  yields: Yields;

  /*
   * Relations
   */
  playerKey: GameKey | null = null;
  player = canHaveOne<Player>(this.playerKey, `${this.key}.player`);

  unitKeys = ref([] as GameKey[]);
  units = hasMany<Unit[]>(this.unitKeys, `${this.key}.units`);

  /*
   * Computed
   */
  // todo add here

  /*
   * Actions
   */
  // todo add here
}
