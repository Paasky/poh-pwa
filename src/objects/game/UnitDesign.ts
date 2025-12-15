import { computed, ref } from "vue";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { Yield, Yields } from "@/objects/yield";
import { TypeObject } from "@/types/typeObjects";
import { canHaveOne, hasMany } from "@/objects/game/_relations";
import type { Player } from "@/objects/game/Player";
import type { Unit } from "@/objects/game/Unit";
import { TypeKey } from "@/types/common";

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

    const allYields = new Yields(this.types.flatMap((t) => t.yields.all()));
    this.yields = allYields.not(["yieldType:productionCost"]).applyMods();
    this.productionCost = allYields
      .only(["yieldType:productionCost"])
      .applyMods()
      .getLumpAmount("yieldType:productionCost");

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
  prodCostYield = computed(
    (): Yield => ({
      type: "yieldType:productionCost",
      amount: this.productionCost,
      method: "lump",
      for: [],
      vs: [],
    }),
  );

  domainKey(): TypeKey {
    if (
      [
        "platformCategory:sailHull",
        "platformCategory:poweredHull",
        "platformCategory:submersible",
      ].includes(this.platform.key)
    ) {
      return "domainType:water";
    }

    if (
      [
        "platformCategory:aircraft",
        "platformCategory:helicopter",
        "platformCategory:missile",
      ].includes(this.platform.key)
    ) {
      return "domainType:air";
    }

    if (["platformCategory:satellite"].includes(this.platform.key)) {
      return "domainType:space";
    }

    return "domainType:land";
  }

  /*
   * Actions
   */
  // todo add here
}
