import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import { Yield, Yields } from "@/Common/Objects/Yields";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { canHaveOne, hasMany } from "@/Common/Models/_Relations";
import type { Player } from "@/Common/Models/Player";
import type { Unit } from "@/Common/Models/Unit";
import { TypeKey } from "@/Common/Objects/Common";

export class UnitDesign extends GameObject {
  constructor(
    key: GameKey,
    public platform: TypeObject,
    public equipment: TypeObject,
    public name: string,
    public playerKey: GameKey | null = null,
    public isElite = false,
    public isActive = true,
  ) {
    super(key);

    this.types = [this.platform, this.equipment];

    const allYields = new Yields(this.types.flatMap((t) => t.yields.all()));
    this.yields = allYields.not(["yieldType:productionCost"]);
    this.productionCost = allYields
      .only(["yieldType:productionCost"])
      .flatten()
      .getLumpAmount("yieldType:productionCost");

    canHaveOne<Player>(this, "playerKey");

    hasMany<Unit>(this, "unitKeys");
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "platform", isTypeObj: true },
    { attrName: "equipment", isTypeObj: true },
    { attrName: "name" },
    {
      attrName: "playerKey",
      isOptional: true,
      related: { theirKeyAttr: "designKeys" },
    },
    { attrName: "isElite", isOptional: true },
    { attrName: "isActive", isOptional: true },
  ];

  /*
   * Attributes
   */
  productionCost: number;
  types: Set<TypeObject>;
  yields: Yields;

  /*
   * Relations
   */
  declare player: Player | null;

  unitKeys = new Set<GameKey>();
  declare units: Unit[];

  /*
   * Computed
   */
  get prodCostYield(): Yield {
    return {
      type: "yieldType:productionCost",
      amount: this.productionCost,
      method: "lump",
      for: [],
      vs: [],
    };
  }

  domainKey(): TypeKey {
    const cat = this.platform.category as string;
    if (
      [
        "platformCategory:sailHull",
        "platformCategory:poweredHull",
        "platformCategory:submersible",
      ].includes(cat)
    ) {
      return "domainType:water";
    }

    if (
      [
        "platformCategory:aircraft",
        "platformCategory:helicopter",
        "platformCategory:missile",
      ].includes(cat)
    ) {
      return "domainType:air";
    }

    if (["platformCategory:satellite"].includes(cat)) {
      return "domainType:space";
    }

    return "domainType:land";
  }

  /*
   * Actions
   */
  // todo add here
}
