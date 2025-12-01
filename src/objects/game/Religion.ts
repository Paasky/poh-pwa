import { hasMany } from "@/objects/game/_mixins";
import { TypeObject } from "@/types/typeObjects";
import { computed, ref } from "vue";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import { Citizen } from "@/objects/game/Citizen";
import { Player } from "@/objects/game/Player";

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
    this.name = name;
    this.cityKey = cityKey;
    this.foundedTurn = foundedTurn;
    if (status) this.status.value = status;
    this.myths.value = myths;
    this.gods.value = gods;
    this.dogmas.value = dogmas;
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

  name: string;
  foundedTurn: number;
  status = ref<ReligionStatus>("myths");
  myths = ref<TypeObject[]>([]);
  gods = ref<TypeObject[]>([]);
  dogmas = ref<TypeObject[]>([]);

  citizenKeys = ref([] as GameKey[]);
  citizens = hasMany(this.citizenKeys, Citizen);

  cityKey: GameKey;
  city = computed(() => useObjectsStore().get(this.cityKey) as GameObject);

  playerKeys = ref([] as GameKey[]);
  players = hasMany(this.playerKeys, Player);

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

  types = computed(() => [
    this.concept,
    ...this.myths.value,
    ...this.gods.value,
    ...this.dogmas.value,
  ]);

  canEvolve = computed(() => false);
}
