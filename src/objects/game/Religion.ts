import { hasMany, hasOne } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { computed, ComputedRef, ref, watch } from "vue";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import type { Citizen } from "@/objects/game/Citizen";
import type { Player } from "@/objects/game/Player";
import type { City } from "@/objects/game/City";
import { useEventStore } from "@/stores/eventStore";
import { ReligionCanSelect, ReligionHasEvolved, ReligionHasNewType } from "@/events/Religion";

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

    watch(this.canSelect, (newValue, oldValue) => {
      if (!oldValue && newValue) {
        useEventStore().turnEvents.push(new ReligionCanSelect(this) as any);
      }
    });
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
  canEvolve = computed(() => {
    // Can only evolve if can select a new type
    if (!this.canSelect.value) return false;

    switch (this.status.value) {
      case "myths":
        return this.myths.value.length > 3;
      case "gods":
        return this.gods.value.length > 6;
      default:
        return false;
    }
  });

  canSelect = computed(() => {
    const holyCityOwner = this.city.value.player.value;
    // If the holy city owner doesn't follow the religion: can never select
    if (holyCityOwner.religionKey.value !== this.key) {
      return false;
    }

    return holyCityOwner.storage.amount("yieldType:faith") >= this.faithToGrow.value;
  });

  faithToGrow = computed(() =>
    Math.round(
      ((this.dogmas.value.length + this.gods.value.length + this.myths.value.length) * 7) ** 1.2,
    ),
  );

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
   * Watchers
   */

  /*
   * Actions
   */
  startTurn(): void {
    //
  }

  evolve(): void {
    if (!this.canEvolve.value) {
      throw new Error(`Can't evolve ${this.name}`);
    }
    switch (this.status.value) {
      case "myths":
        this.status.value = "gods";
        break;
      case "gods":
        this.status.value = "dogmas";
        break;
      default:
        throw new Error(`Can't evolve ${this.name}`);
    }

    useEventStore().turnEvents.push(new ReligionHasEvolved(this) as any);
  }

  selectMyth(myth: TypeObject): void {
    if (this.myths.value.includes(myth)) {
      throw new Error(`Myth ${myth.name} already selected`);
    }
    this.myths.value.push(myth);

    useEventStore().turnEvents.push(new ReligionHasNewType(this, myth) as any);
  }

  selectGod(god: TypeObject): void {
    if (this.gods.value.includes(god)) {
      throw new Error(`God ${god.name} already selected`);
    }
    this.gods.value.push(god);

    useEventStore().turnEvents.push(new ReligionHasNewType(this, god) as any);
  }

  selectDogma(dogma: TypeObject, keepGod?: TypeObject): void {
    if (this.dogmas.value.includes(dogma)) {
      throw new Error(`Dogma ${dogma.name} already selected`);
    }

    if (dogma.specials.includes("specialType:canHaveOnlyOneGod")) {
      if (!keepGod || !this.gods.value.includes(keepGod)) {
        throw new Error(`Can only keep one selected God with ${dogma.name}`);
      }
      this.gods.value = [keepGod];
    }

    this.dogmas.value.push(dogma);

    useEventStore().turnEvents.push(new ReligionHasNewType(this, dogma) as any);
  }
}
