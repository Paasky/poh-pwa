import { canHaveOne, hasMany, hasOne } from "@/objects/game/_relations";
import { computed, ComputedRef, ref } from "vue";
import { TypeObject } from "@/types/typeObjects";
import { TypeStorage } from "@/objects/storage";
import { Yields } from "@/objects/yield";
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
import { getNeighbors } from "@/helpers/mapTools";
import { useObjectsStore } from "@/stores/objectStore";
import { Diplomacy } from "@/objects/player/Diplomacy";

export class Player extends GameObject {
  constructor(
    key: GameKey,
    cultureKey: GameKey,
    name: string,
    isCurrent = false,
    isMinor = false,
    religionKey?: GameKey,
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

  knownTileKeys = computed(() =>
    this.units.value
      .map((u) => [
        u.tileKey.value,
        ...getNeighbors(
          useObjectsStore().world.size,
          u.tile.value,
          useObjectsStore().getTiles,
          "hex",
          2,
        ).map((t) => t.key),
      ])
      .flat(),
  );
  visibleTileKeys = computed(() =>
    this.units.value
      .map((u) => [
        u.tileKey.value,
        ...getNeighbors(
          useObjectsStore().world.size,
          u.tile.value,
          useObjectsStore().getTiles,
          "hex",
        ).map((t) => t.key),
      ])
      .flat(),
  );

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

  leader = computed(() => this.culture.value.leader.value);

  // Player yields is the total lump output (+/-) of all Cities, Deals, Units and Trade Routes
  yields = computed(() => new Yields());

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

  endTurn(): void {
    //
  }
}
