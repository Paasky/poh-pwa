import { hasMany, hasOne } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { computed, ComputedRef, Ref, ref, UnwrapRef } from "vue";
import { CatKey, TypeKey } from "@/types/common";
import { EventManager } from "@/managers/EventManager";
import { Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import type { Citizen } from "@/objects/game/Citizen";
import type { Player } from "@/objects/game/Player";

export type CultureStatus = "notSettled" | "canSettle" | "mustSettle" | "settled";

export class Culture extends GameObject {
  constructor(key: GameKey, type: TypeObject, playerKey: GameKey) {
    super(key);

    this.type = ref(type);

    this.playerKey = playerKey;
    this.player = hasOne<Player>(this.playerKey, `${this.key}.player`);
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "type", isTypeObj: true },
    {
      attrName: "playerKey",
      attrNotRef: true,
      related: { theirKeyAttr: "cultureKey", isOne: true },
    },
  ];

  /*
   * Attributes
   */
  heritages = ref([] as TypeObject[]);
  heritageCategoryPoints = ref({} as Record<CatKey, number>);
  mustSelectTraits = ref({ positive: 0, negative: 0 });
  status = ref<CultureStatus>("notSettled");
  traits = ref([] as TypeObject[]);
  type: Ref<UnwrapRef<TypeObject>, UnwrapRef<TypeObject> | TypeObject>;

  /*
   * Relations
   */
  citizenKeys = ref([] as GameKey[]);
  citizens = hasMany<Citizen>(this.citizenKeys, `${this.key}.citizens`);

  playerKey: GameKey;
  player: ComputedRef<Player>;

  /*
   * Computed
   */
  leader = computed(() => {
    const leaderKey = this.type.value.allows.find(
      (a) => a.indexOf("majorLeaderType:") >= 0,
    ) as TypeKey;
    if (!leaderKey) {
      throw new Error(
        `${this.type.value.key}.allows has no majorLeaderType: ${JSON.stringify(this.type.value.allows)}`,
      );
    }
    return useObjectsStore().getTypeObject(leaderKey);
  });

  region = computed((): TypeObject => {
    const key = this.type.value.requires!.filter(["regionType"]).allTypes[0] as TypeKey;
    return useObjectsStore().getTypeObject(key);
  });

  selectableHeritages = computed((): TypeObject[] => {
    if (this.status.value === "mustSettle") return [];
    if (this.status.value === "settled") return [];

    const selectable: TypeObject[] = [];
    for (const catData of useObjectsStore().getClassTypesPerCategory("heritageType")) {
      const catIsSelected = catData.types.some((h) => this.heritages.value.includes(h));

      for (const heritage of catData.types) {
        // Already selected
        if (this.heritages.value.includes(heritage)) continue;

        // If it's stage II -> must have stage I heritage selected
        if (heritage.heritagePointCost! > 10 && !catIsSelected) continue;

        // Not enough points
        if (
          (this.heritageCategoryPoints.value[heritage.category!] ?? 0) < heritage.heritagePointCost!
        )
          continue;

        selectable.push(heritage);
      }
    }
    return selectable;
  });

  selectableTraits = computed((): TypeObject[] => {
    if (this.status.value !== "settled") return [];

    // Nothing to select?
    if (this.mustSelectTraits.value.positive + this.mustSelectTraits.value.negative <= 0) return [];

    const selectable: TypeObject[] = [];
    for (const catData of useObjectsStore().getClassTypesPerCategory("traitType")) {
      const catIsSelected = catData.types.some((t) => this.traits.value.includes(t));

      for (const trait of catData.types) {
        // Category already selected
        if (catIsSelected) continue;

        // No more positive/negative slots left to select
        if (trait.isPositive! && this.mustSelectTraits.value.positive <= 0) continue;
        if (!trait.isPositive! && this.mustSelectTraits.value.negative <= 0) continue;

        selectable.push(trait);
      }
    }
    return selectable;
  });

  types = computed(() => [this.concept, ...this.heritages.value, ...this.traits.value]);

  yields = computed(() => new Yields(this.types.value.flatMap((t) => t.yields.all())));

  /*
   * Actions
   */
  addHeritagePoints(catKey: CatKey, points: number) {
    this.heritageCategoryPoints.value[catKey] =
      (this.heritageCategoryPoints.value[catKey] ?? 0) + points;
  }

  evolve() {
    const nextTypeKey = this.type.value.upgradesTo[0];
    if (!nextTypeKey) throw new Error(`${this.key} cannot evolve further`);

    this.type.value = useObjectsStore().getTypeObject(nextTypeKey);

    // If all traits have not been selected yet (4 = two categories to select: one must be pos, one neg)
    if (this.selectableTraits.value.length >= 4) {
      this.mustSelectTraits.value.positive++;
      this.mustSelectTraits.value.negative++;
    }

    new EventManager().create(
      "cultureEvolved",
      `evolved to the ${this.type.value.name} culture`,
      this.player.value,
      this,
    );
  }

  selectHeritage(heritage: TypeObject) {
    if (this.heritages.value.includes(heritage)) return;
    if (!this.selectableHeritages.value.includes(heritage))
      throw new Error(`${this.key}: ${heritage.name} not selectable`);

    // Add the heritage
    this.heritages.value.push(heritage);

    // Check if culture status needs to change
    if (this.heritages.value.length === 2) {
      this.status.value = "canSettle";
    }
    if (this.heritages.value.length > 2) {
      this.status.value = "mustSettle";
    }

    // If gains a tech, complete it immediately
    for (const gainKey of heritage.gains) {
      if (gainKey.startsWith("technologyType:")) {
        this.player.value.research.complete(useObjectsStore().getTypeObject(gainKey));
      }
    }
  }

  selectTrait(trait: TypeObject) {
    if (this.traits.value.includes(trait)) return;
    if (!this.selectableTraits.value.includes(trait))
      throw new Error(`${this.key}: ${trait.name} not selectable`);

    this.traits.value.push(trait);
    if (trait.isPositive!) {
      this.mustSelectTraits.value.positive--;
    } else {
      this.mustSelectTraits.value.negative--;
    }
  }

  settle() {
    if (this.status.value === "settled") return;
    this.status.value = "settled";
    this.mustSelectTraits.value = { positive: 2, negative: 2 };
    new EventManager().create("settled", `settled down`, this.player.value, this);
  }
}
