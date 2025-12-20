/* eslint-disable @typescript-eslint/no-unused-expressions */
import { canHaveOne, hasMany, hasOne } from "@/objects/game/_relations";
import { computed, ComputedRef, ref, watch } from "vue";
import { TypeObject } from "@/types/typeObjects";
import { TypeStorage } from "@/objects/storage";
import { Yield, Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import type { UnitDesign } from "@/objects/game/UnitDesign";
import type { City } from "@/objects/game/City";
import type { Agenda } from "@/objects/game/Agenda";
import type { Deal } from "@/objects/game/Deal";
import type { Culture } from "@/objects/game/Culture";
import { Government } from "@/objects/player/Government";
import { Research } from "@/objects/player/Research";
import type { Citizen } from "@/objects/game/Citizen";
import type { Religion } from "@/objects/game/Religion";
import type { Tile } from "@/objects/game/Tile";
import type { TradeRoute } from "@/objects/game/TradeRoute";
import type { Unit } from "@/objects/game/Unit";
import { Diplomacy } from "@/objects/player/Diplomacy";
import { ObjKey, TypeKey } from "@/types/common";
import { useObjectsStore } from "@/stores/objectStore";

export class Player extends GameObject {
  constructor(
    key: GameKey,
    cultureKey: GameKey,
    name: string,
    isCurrent = false,
    isMinor = false,
    religionKey?: GameKey,
    knownTileKeys?: GameKey[],
  ) {
    super(key);

    this.diplomacy = new Diplomacy(key);
    this.isCurrent = isCurrent;
    this.isMinor = isMinor;
    this.government = new Government(key);
    this.name = name;
    this.research = new Research(key);

    // Culture is special:
    this.cultureKey = cultureKey;
    this.culture = hasOne<Culture>(this.cultureKey, `${this.key}.culture`);

    if (religionKey) this.religionKey.value = religionKey;

    if (knownTileKeys) this.knownTileKeys.value = new Set(knownTileKeys);

    // Always include visile tiles in known keys
    watch(this.visibleTileKeys, (keys) => {
      keys.forEach((k) => this.knownTileKeys.value.add(k));
    });
  }

  static attrsConf: GameObjAttr[] = [
    {
      attrName: "cultureKey",
      attrNotRef: true,
      related: { theirKeyAttr: "playerKey", isOne: true },
    },
    { attrName: "name", attrNotRef: true },
    { attrName: "isCurrent", attrNotRef: true, isOptional: true },
    { attrName: "isMinor", attrNotRef: true, isOptional: true },
    {
      attrName: "religionKey",
      isOptional: true,
      related: { theirKeyAttr: "playerKeys" },
    },
    {
      attrName: "knownTileKeys",
      isOptional: true,
    },
  ];

  /*
   * Attributes
   */
  diplomacy: Diplomacy;
  government: Government;
  isCurrent = false;
  isMinor = false;
  knownTypes = computed(() => [] as TypeObject[]);
  name: string;
  research: Research;
  storage = new TypeStorage();

  /*
   * Relations
   */
  agendaKeys = ref([] as GameKey[]);
  agendas = hasMany<Agenda>(this.agendaKeys, `${this.key}.agendas`);

  citizenKeys = ref([] as GameKey[]);
  citizens = hasMany<Citizen>(this.citizenKeys, `${this.key}.citizens`);

  cultureKey: GameKey;
  culture: ComputedRef<Culture>;

  cityKeys = ref([] as GameKey[]);
  cities = hasMany<City>(this.cityKeys, `${this.key}.cities`);

  dealKeys = ref([] as GameKey[]);
  deals = hasMany<Deal>(this.dealKeys, `${this.key}.deals`);

  designKeys = ref([] as GameKey[]);
  designs = hasMany<UnitDesign>(this.designKeys, `${this.key}.designs`);

  knownTileKeys = ref(new Set<GameKey>());

  religionKey = ref(null as GameKey | null);
  religion = canHaveOne<Religion>(this.religionKey, `${this.key}.religion`);

  tileKeys = ref([] as GameKey[]);
  tiles = hasMany<Tile>(this.tileKeys, `${this.key}.tiles`);

  tradeRouteKeys = ref([] as GameKey[]);
  tradeRoutes = hasMany<TradeRoute>(this.tradeRouteKeys, `${this.key}.tradeRoutes`);

  unitKeys = ref([] as GameKey[]);
  units = hasMany<Unit>(this.unitKeys, `${this.key}.units`);

  /*
   * Computed
   */
  activeDesigns = computed(() => this.designs.value.filter((d) => d.isActive.value));

  commonTypes = computed(
    (): TypeObject[] =>
      [...this.government.policies.value, ...this.research.researched.value] as TypeObject[],
  );

  leader = computed(() => this.culture.value.leader.value);

  ownedTypes = computed(() => this.cities.value.flatMap((city) => city.ownedTypes.value));

  specialTypes = computed(
    () =>
      [
        ...this.culture.value.heritages.value,
        ...this.culture.value.traits.value,
        ...(this.religion.value?.myths.value ?? []),
        ...(this.religion.value?.gods.value ?? []),
        ...(this.religion.value?.dogmas.value ?? []),
      ] as TypeObject[],
  );

  visibleTileKeys = computed(() => {
    const keys = new Set<GameKey>(this.tileKeys.value);

    // Prevent crash if store is not ready yet
    if (!useObjectsStore().ready) return keys;

    this.units.value.forEach((u) => u.visibleTileKeys.value.forEach((k) => keys.add(k)));
    return keys;
  });

  // Player yield mods are the combined nation-wide yield for/vs
  yieldMods = computed(() => {
    const yieldMods = new Yields();

    // Add any Common Type yield that is for/vs (aka is a yield mod)
    for (const type of this.commonTypes.value) {
      for (const y of type.yields.all()) {
        if (y.for.length + y.vs.length > 0) {
          yieldMods.add(y);
        }
      }
    }

    // Add any Culture/Religion Type yield that is for/vs AND NOT for Citizens
    for (const type of this.specialTypes.value) {
      for (const y of type.yields.all()) {
        const forOthers = y.for.filter((forKey: ObjKey) => forKey !== "conceptType:citizen");

        // Does it have any mods we can use?
        if (forOthers.length + y.vs.length > 0) {
          yieldMods.add({
            type: y.type,
            amount: y.amount,
            method: y.method,
            for: forOthers,
            vs: y.vs,
          } as Yield);
        }
      }
    }

    // Add any Owned Type yields that is for/vs a specialType
    for (const type of this.ownedTypes.value) {
      for (const y of type.yields.all()) {
        const forSpecials = y.for.filter((forKey: ObjKey) => forKey.startsWith("specialType:"));
        const vsSpecials = y.for.filter((forKey: ObjKey) => forKey.startsWith("specialType:"));

        // Does it have any mods we can use?
        if (forSpecials.length + vsSpecials.length > 0) {
          yieldMods.add({
            type: y.type,
            amount: y.amount,
            method: y.method,
            for: forSpecials,
            vs: vsSpecials,
          } as Yield);
        }
      }
    }

    return yieldMods;
  });

  // Player yields is the total lump output (+/-) of all Cities, Deals and Units
  yields = computed(() => {
    const yields = new Yields();
    const inheritYieldTypes = [
      "yieldType:culture",
      "yieldType:faith",
      "yieldType:gold",
      "yieldType:influence",
      "yieldType:science",
      "yieldType:upkeep",
    ] as TypeKey[];

    const inheritFromGameObjs = [
      ...this.cities.value,
      ...this.deals.value,
      ...this.units.value,
    ] as (City | Deal | Unit)[];

    for (const gameObj of inheritFromGameObjs) {
      for (const y of gameObj.yields.value.applyMods().all()) {
        if (
          y.amount &&
          y.method === "lump" &&
          y.for.length + y.vs.length === 0 &&
          inheritYieldTypes.includes(y.type)
        ) {
          yields.add({
            type: y.type,
            amount: y.amount,
            method: y.method,
            for: [],
            vs: [],
          } as Yield);
        }
      }
    }

    return yields;
  });

  /*
   * Actions
   */
  startTurn(): void {
    // Load the yields from the end of the prev turn into storage
    this.storage.load(this.yields.value.toStorage().all());

    this.cities.value.forEach((c) => c.startTurn());
    this.units.value.forEach((u) => u.startTurn());

    this.culture.value.startTurn();
    this.diplomacy.startTurn();
    this.government.startTurn();
    this.religion.value?.startTurn();
    this.research.startTurn();
  }

  endTurn(): boolean {
    // Try to move remaining auto-moves (units on multi-turn move + units on trade routes)
    // On refusal, return false
    // After all done, return true
    for (const unit of this.units.value) {
      if (!unit.endTurn()) return false;
    }
    return true;
  }

  warmUp(): void {
    this.agendas.value;
    this.citizens.value;
    this.culture.value;
    this.cities.value;
    this.deals.value;
    this.designs.value;
    this.knownTileKeys.value;
    this.visibleTileKeys.value;
    this.religion.value;
    this.tiles.value;
    this.tradeRoutes.value;
    this.units.value;

    this.activeDesigns.value;
    this.leader.value;
    this.commonTypes.value;
    this.specialTypes.value;
    this.ownedTypes.value;
    this.yieldMods.value;
    this.yields.value;
  }
}
