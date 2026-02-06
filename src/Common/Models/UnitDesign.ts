import { GameKey, GameObjAttr, GameObject } from "./_GameModel";
import { unitYieldTypeKeys, Yield, Yields } from "../Static/Objects/Yields";
import { TypeObject } from "../Static/Objects/TypeObject";
import type { Player } from "./Player";
import type { Unit } from "./Unit";
import { useDataBucket } from "../../Data/useDataBucket";

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

    this.domain = this.getDomain();
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
  domain: TypeObject;

  /*
   * Relations
   */
  get player(): Player | null {
    return this.canHaveOne<Player>("player", "playerKey");
  }

  unitKeys = new Set<GameKey>();
  get units(): Map<GameKey, Unit> {
    return this.hasMany<Unit>("units", "unitKeys");
  }

  /*
   * Computed
   */

  get productionCost(): number {
    return this.computed(
      "productionCost",
      () => this.yields.getLumpAmount("yieldType:productionCost"),
      { props: ["yields"] },
    );
  }

  get types(): Set<TypeObject> {
    return new Set([this.concept, this.domain, this.platform, this.equipment]);
  }

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "yields",
      () => {
        const yieldsForMe = (yields: Yields): Yield[] => {
          return yields.only(unitYieldTypeKeys, new Set<TypeObject>([this.concept])).all();
        };

        // Design Yields are Platform + Equipment + Player Mods
        const yields = new Yields([...this.platform.yields.all(), ...this.equipment.yields.all()]);
        if (this.player) yields.add(...yieldsForMe(this.player.yieldMods));

        // Flatten Yields to apply modifiers
        return yields.flatten();
      },
      { relations: [{ relName: "player", relProps: ["yieldMods"] }] },
    );
  }

  private getDomain(): TypeObject {
    const cat = this.platform.category as string;
    if (
      [
        "platformCategory:sailHull",
        "platformCategory:poweredHull",
        "platformCategory:submersible",
      ].includes(cat)
    ) {
      return useDataBucket().getType("domainType:water");
    }

    if (
      [
        "platformCategory:aircraft",
        "platformCategory:helicopter",
        "platformCategory:missile",
      ].includes(cat)
    ) {
      return useDataBucket().getType("domainType:air");
    }

    if (["platformCategory:satellite"].includes(cat)) {
      return useDataBucket().getType("domainType:space");
    }

    return useDataBucket().getType("domainType:land");
  }

  /*
   * Actions
   */
  get actions(): Set<TypeObject> {
    return this.computed(
      "actions",
      () => {
        const actions = new Set<TypeObject>();
        const db = useDataBucket();

        this.platform.actions.forEach((key) => actions.add(db.getType(key)));
        this.equipment.actions.forEach((key) => actions.add(db.getType(key)));

        return actions;
      },
      { props: ["platform", "equipment"] },
    );
  }

  get availableActions(): Set<TypeObject> {
    return this.computed(
      "availableActions",
      () => {
        // todo filter available
        return this.actions;
      },
      { props: ["actions"] },
    );
  }
}
