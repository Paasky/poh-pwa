import { TypeObject } from "../Static/Objects/TypeObject";
import { CatKey, TypeKey } from "../Static/StaticEnums";
import { Yields } from "../Static/Objects/Yields";
import { GameKey, GameObjAttr, GameObject } from "./_GameModel";
import { useDataBucket } from "@/Data/useDataBucket";
import type { Citizen } from "./Citizen";
import type { Player } from "./Player";
import type { Tile } from "./Tile";
import { useEventStore } from "@/App/stores/eventStore";
import { has } from "../Helpers/collectionTools";

export type CultureStatus = "notSettled" | "canSettle" | "mustSettle" | "settled";

export class Culture extends GameObject {
  constructor(
    key: GameKey,
    public type: TypeObject,
    public playerKey: GameKey,
    public status: CultureStatus = "notSettled",
  ) {
    super(key);
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "type", isTypeObj: true },
    {
      attrName: "playerKey",
      related: { theirKeyAttr: "cultureKey", isOne: true },
    },
    { attrName: "status", isOptional: true },
    { attrName: "heritages", isOptional: true, isTypeObjArray: true },
    { attrName: "heritageCategoryPoints", isOptional: true },
    { attrName: "mustSelectTraits", isOptional: true },
    { attrName: "traits", isOptional: true, isTypeObjArray: true },
  ];

  /*
   * Attributes
   */
  heritages: Set<TypeObject> = new Set();
  heritageCategoryPoints: Record<CatKey, number> = {};
  mustSelectTraits = { positive: 0, negative: 0 };
  traits: Set<TypeObject> = new Set();

  /*
   * Relations
   */
  citizenKeys = new Set<GameKey>();
  get citizens(): Map<GameKey, Citizen> {
    return this.hasMany<Citizen>("citizens", "citizenKeys");
  }

  get player(): Player {
    return this.hasOne<Player>("player", "playerKey");
  }

  /*
   * Computed
   */
  get canSelect(): boolean {
    return this.selectableHeritages.size + this.selectableTraits.size > 0;
  }

  get canSettle(): boolean {
    return this.status === "canSettle" || this.status === "mustSettle";
  }

  get leader(): TypeObject {
    const leaderKey = this.type.allows.find((a) => a.indexOf("majorLeaderType:") >= 0) as TypeKey;
    if (!leaderKey) {
      throw new Error(
        `${this.type.key}.allows has no majorLeaderType: ${JSON.stringify(this.type.allows)}`,
      );
    }
    return useDataBucket().getType(leaderKey);
  }

  get region(): TypeObject {
    const key = this.type.requires!.filter(["regionType"]).allTypes[0] as TypeKey;
    return useDataBucket().getType(key);
  }

  get selectableHeritages(): Set<TypeObject> {
    if (this.status === "mustSettle") return new Set();
    if (this.status === "settled") return new Set();

    const selectable: Set<TypeObject> = new Set();
    for (const catData of useDataBucket().getClassTypesPerCategory("heritageType").values()) {
      const catIsSelected = has(catData.types, (type) => this.heritages.has(type));

      for (const heritage of catData.types) {
        // Already selected
        if (this.heritages.has(heritage)) continue;

        // If it's stage II -> must have stage I heritage selected
        if (heritage.heritagePointCost! > 10 && !catIsSelected) continue;

        // Not enough points
        if ((this.heritageCategoryPoints[heritage.category!] ?? 0) < heritage.heritagePointCost!)
          continue;

        selectable.add(heritage);
      }
    }
    return selectable;
  }

  get selectableTraits(): Set<TypeObject> {
    if (this.status !== "settled") return new Set();

    // Nothing to select?
    if (this.mustSelectTraits.positive + this.mustSelectTraits.negative <= 0) return new Set();

    const selectable: Set<TypeObject> = new Set();
    for (const catData of useDataBucket().getClassTypesPerCategory("traitType").values()) {
      const catIsSelected = has(catData.types, (type) => this.traits.has(type));

      for (const trait of catData.types) {
        // Category already selected
        if (catIsSelected) continue;

        // No more positive/negative slots left to select
        if (trait.isPositive! && this.mustSelectTraits.positive <= 0) continue;
        if (!trait.isPositive! && this.mustSelectTraits.negative <= 0) continue;

        selectable.add(trait);
      }
    }
    return selectable;
  }

  /*
   * Actions
   */
  addHeritagePoints(catKey: CatKey, points: number) {
    this.heritageCategoryPoints[catKey] = (this.heritageCategoryPoints[catKey] ?? 0) + points;
  }

  onTileDiscovered(tile: Tile) {
    if (this.status === "settled") return;

    for (const type of tile.types) {
      for (const allowedKey of type.allows) {
        if (allowedKey.startsWith("heritageType:")) {
          const heritage = useDataBucket().getType(allowedKey as TypeKey);
          if (heritage.category) {
            this.addHeritagePoints(heritage.category, 1);
          }
        }
      }
    }
  }

  evolve() {
    const nextTypeKey = this.type.upgradesTo[0];
    if (!nextTypeKey) throw new Error(`${this.key} cannot evolve further`);

    this.type = useDataBucket().getType(nextTypeKey);

    // If all traits have not been selected yet (4 = two categories to select: one must be pos, one neg)
    if (this.selectableTraits.size >= 4) {
      this.mustSelectTraits.positive++;
      this.mustSelectTraits.negative++;
    }

    // todo CultureEvolved event
  }

  selectHeritage(heritage: TypeObject) {
    if (this.heritages.has(heritage)) return;
    if (!this.selectableHeritages.has(heritage))
      throw new Error(`${this.key}: ${heritage.name} not selectable`);

    // Add the heritage
    this.heritages.add(heritage);
    useEventStore().turnEvents.push(new CultureHasNewType(this, heritage));

    // Check if culture status needs to change
    if (this.heritages.size === 2) {
      this.status = "canSettle";
    }
    if (this.heritages.size > 2) {
      this.status = "mustSettle";
    }

    // If gains a tech, complete it immediately
    for (const gainKey of heritage.gains) {
      if (gainKey.startsWith("technologyType:")) {
        this.player.research.complete(useDataBucket().getType(gainKey));
      }
    }
  }

  selectTrait(trait: TypeObject) {
    if (this.traits.has(trait)) return;
    if (!this.selectableTraits.has(trait)) {
      throw new Error(`${this.key}: ${trait.name} not selectable`);
    }

    this.traits.add(trait);
    useEventStore().turnEvents.push(new CultureHasNewType(this, trait));

    if (trait.isPositive!) {
      this.mustSelectTraits.positive--;
    } else {
      this.mustSelectTraits.negative--;
    }
  }

  settle() {
    if (this.status === "settled") return;
    this.status = "settled";
    this.mustSelectTraits = { positive: 2, negative: 2 };
    useEventStore().turnEvents.push(new CultureHasSettled(this));
  }

  startTurn(): void {
    //
  }

  ////// v0.1

  get myTypes(): Set<TypeObject> {
    return this.computed(
      "myTypes",
      () => new Set([...this.heritages, ...this.traits, this.type, this.concept]),
      { props: ["heritages", "traits", "type"] },
    );
  }

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "yields",
      () => {
        const yields = new Yields();
        this.myTypes.forEach((type) => yields.add(...type.yields.all()));
        return yields;
      },
      {
        props: ["heritages", "traits", "type"],
        relations: [{ relName: "myTypes", relProps: ["yields"] }],
      },
    );
  }
}
