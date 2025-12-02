import { hasMany, hasOne } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { computed, ComputedRef, ref } from "vue";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import type { Citizen } from "@/objects/game/Citizen";
import type { Player } from "@/objects/game/Player";
import type { City } from "@/objects/game/City";

export type ReligionStatus = "myths" | "gods" | "dogmas";

export class Religion extends GameObject {
  constructor(
    key: GameKey,
    name: string,
    cityKey: GameKey,
    foundedTurn: number,
    status?: ReligionStatus,
    myths: TypeObject[] = [],
    gods: TypeObject[] = [],
    dogmas: TypeObject[] = [],
  ) {
    super(key);
    this.dogmas.value = dogmas;
    this.foundedTurn = foundedTurn;
    this.gods.value = gods;
    this.name = name;
    this.myths.value = myths;
    if (status) this.status.value = status;

    this.cityKey = cityKey;
    this.city = hasOne<City>(this.cityKey, `${this.key}.city`);
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "name", attrNotRef: true },
    {
      attrName: "cityKey",
      attrNotRef: true,
      related: { theirKeyAttr: "holyCityForKeys" },
    },
    { attrName: "foundedTurn", attrNotRef: true },
    { attrName: "status", isOptional: true },
    { attrName: "myths", isOptional: true, isTypeObjArray: true },
    { attrName: "gods", isOptional: true, isTypeObjArray: true },
    { attrName: "dogmas", isOptional: true, isTypeObjArray: true },
  ];

  /*
   * Attributes
   */
  dogmas = ref<TypeObject[]>([]);
  foundedTurn: number;
  gods = ref<TypeObject[]>([]);
  name: string;
  myths = ref<TypeObject[]>([]);
  status = ref<ReligionStatus>("myths");

  /*
   * Relations
   */
  citizenKeys = ref([] as GameKey[]);
  citizens = hasMany<Citizen>(this.citizenKeys, `${this.key}.citizens`);

  cityKey: GameKey;
  city: ComputedRef<City>;

  playerKeys = ref([] as GameKey[]);
  players = hasMany<Player>(this.playerKeys, `${this.key}.players`);

  /*
   * Computed
   */
  canEvolve = computed(() => false);

  selectableDogmas = computed((): TypeObject[] => {
    if (this.status.value !== "dogmas") return [];

    const selectable: TypeObject[] = [];
    for (const dogma of useObjectsStore().getClassTypes("dogmaType")) {
      // Category already chosen
      if (this.dogmas.value.some((m) => m.category === dogma.category)) {
        continue;
      }

      if (
        dogma.requires.isEmpty ||
        // IDE mixes up ref contents
        // eslint-disable-next-line
        dogma.requires.isSatisfied(this.dogmas.value as any)
      ) {
        selectable.push(dogma);
      }
    }

    return selectable;
  });

  selectableGods = computed((): TypeObject[] => {
    if (this.status.value !== "gods") return [];

    const selectable: TypeObject[] = [];
    for (const god of useObjectsStore().getClassTypes("godType")) {
      // Category already chosen
      if (this.gods.value.some((m) => m.category === god.category)) {
        continue;
      }

      if (
        god.requires.isEmpty ||
        // IDE mixes up ref contents
        // eslint-disable-next-line
        god.requires.isSatisfied(this.gods.value as any)
      ) {
        selectable.push(god);
      }
    }

    return selectable;
  });

  selectableMyths = computed((): TypeObject[] => {
    if (this.status.value !== "myths") return [];

    const selectable: TypeObject[] = [];
    for (const myth of useObjectsStore().getClassTypes("mythType")) {
      // Category already chosen
      if (this.myths.value.some((m) => m.category === myth.category)) {
        continue;
      }

      if (
        myth.requires.isEmpty ||
        // IDE mixes up ref contents
        // eslint-disable-next-line
        myth.requires.isSatisfied(this.myths.value as any)
      ) {
        selectable.push(myth);
      }
    }

    return selectable;
  });

  types = computed(() => [
    this.concept,
    ...this.myths.value,
    ...this.gods.value,
    ...this.dogmas.value,
  ]);

  /*
   * Actions
   */
  // todo add here
}
