import { computed, ref } from "vue";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { Yields } from "@/objects/yield";
import { TypeObject } from "@/types/typeObjects";
import { hasMany } from "@/objects/game/_mixins";
import { Player } from "@/objects/game/Player";
import { Unit } from "@/objects/game/Unit";
import { useObjectsStore } from "@/stores/objectStore";

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
    this.platform = platform;
    this.equipment = equipment;
    this.name = name;
    this.isElite = !!isElite;
    this.isActive.value = isActive ?? true;
    if (playerKey) this.playerKey = playerKey;

    this.types = [this.platform, this.equipment];
    this.yields = new Yields(this.types.flatMap((t) => t.yields.all()));
    this.productionCost = this.yields.applyMods().getLumpAmount("yieldType:productionCost");
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

  platform: TypeObject;
  equipment: TypeObject;
  name: string;
  isActive = ref(true);
  isElite: boolean;

  playerKey = null as null | GameKey;
  player = computed(() =>
    this.playerKey ? (useObjectsStore().get(this.playerKey) as Player) : null,
  );

  unitKeys = ref([] as GameKey[]);
  units = hasMany(this.unitKeys, Unit);

  productionCost: number;
  types: TypeObject[];
  yields: Yields;
}
