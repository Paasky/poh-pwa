import { hasMany, hasOne } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { CatKey, TypeKey } from "@/types/common";
import { Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import type { Citizen } from "@/objects/game/Citizen";
import type { Player } from "@/objects/game/Player";
import type { Tile } from "@/objects/game/Tile";
import { useEventStore } from "@/stores/eventStore";
import { CultureHasNewType, CultureHasSettled } from "@/events/Culture";

export type CultureStatus = "notSettled" | "canSettle" | "mustSettle" | "settled";

export class Culture extends GameObject {
  constructor(
    key: GameKey,
    public type: TypeObject,
    public playerKey: GameKey,
    public status: CultureStatus = "notSettled",
  ) {
    super(key);

    hasOne<Player>(this, "playerKey");

    hasMany<Citizen>(this, "citizenKeys");
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
  heritages: TypeObject[] = [];
  heritageCategoryPoints: Record<CatKey, number> = {};
  mustSelectTraits = { positive: 0, negative: 0 };
  traits: TypeObject[] = [];

  /*
   * Relations
   */
  citizenKeys = new Set<GameKey>();
  declare citizens: Citizen[];

  declare player: Player;

  /*
   * Computed
   */
  get canSelect(): boolean {
    return this.selectableHeritages.length + this.selectableTraits.length > 0;
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
    return useObjectsStore().getTypeObject(leaderKey);
  }

  get region(): TypeObject {
    const key = this.type.requires!.filter(["regionType"]).allTypes[0] as TypeKey;
    return useObjectsStore().getTypeObject(key);
  }

  get selectableHeritages(): TypeObject[] {
    if (this.status === "mustSettle") return [];
    if (this.status === "settled") return [];

    const selectable: TypeObject[] = [];
    for (const catData of useObjectsStore().getClassTypesPerCategory("heritageType")) {
      const catIsSelected = catData.types.some((h) => this.heritages.includes(h));

      for (const heritage of catData.types) {
        // Already selected
        if (this.heritages.includes(heritage)) continue;

        // If it's stage II -> must have stage I heritage selected
        if (heritage.heritagePointCost! > 10 && !catIsSelected) continue;

        // Not enough points
        if ((this.heritageCategoryPoints[heritage.category!] ?? 0) < heritage.heritagePointCost!)
          continue;

        selectable.push(heritage);
      }
    }
    return selectable;
  }

  get selectableTraits(): TypeObject[] {
    if (this.status !== "settled") return [];

    // Nothing to select?
    if (this.mustSelectTraits.positive + this.mustSelectTraits.negative <= 0) return [];

    const selectable: TypeObject[] = [];
    for (const catData of useObjectsStore().getClassTypesPerCategory("traitType")) {
      const catIsSelected = catData.types.some((t) => this.traits.includes(t));

      for (const trait of catData.types) {
        // Category already selected
        if (catIsSelected) continue;

        // No more positive/negative slots left to select
        if (trait.isPositive! && this.mustSelectTraits.positive <= 0) continue;
        if (!trait.isPositive! && this.mustSelectTraits.negative <= 0) continue;

        selectable.push(trait);
      }
    }
    return selectable;
  }

  get types(): TypeObject[] {
    return [this.concept, ...this.heritages, ...this.traits];
  }

  get yields(): Yields {
    return new Yields(this.types.flatMap((t) => t.yields.all()));
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
          const heritage = useObjectsStore().getTypeObject(allowedKey as TypeKey);
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

    this.type = useObjectsStore().getTypeObject(nextTypeKey);

    // If all traits have not been selected yet (4 = two categories to select: one must be pos, one neg)
    if (this.selectableTraits.length >= 4) {
      this.mustSelectTraits.positive++;
      this.mustSelectTraits.negative++;
    }

    // todo CultureEvolved event
  }

  selectHeritage(heritage: TypeObject) {
    if (this.heritages.includes(heritage)) return;
    if (!this.selectableHeritages.includes(heritage))
      throw new Error(`${this.key}: ${heritage.name} not selectable`);

    // Add the heritage
    this.heritages.push(heritage);
    useEventStore().turnEvents.push(new CultureHasNewType(this, heritage));

    // Check if culture status needs to change
    if (this.heritages.length === 2) {
      this.status = "canSettle";
    }
    if (this.heritages.length > 2) {
      this.status = "mustSettle";
    }

    // If gains a tech, complete it immediately
    for (const gainKey of heritage.gains) {
      if (gainKey.startsWith("technologyType:")) {
        this.player.research.complete(useObjectsStore().getTypeObject(gainKey));
      }
    }
  }

  selectTrait(trait: TypeObject) {
    if (this.traits.includes(trait)) return;
    if (!this.selectableTraits.includes(trait)) {
      throw new Error(`${this.key}: ${trait.name} not selectable`);
    }

    this.traits.push(trait);
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
}
