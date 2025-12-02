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

export class Player extends GameObject {
  constructor(
    key: GameKey,
    cultureKey: GameKey,
    name: string,
    isCurrent = false,
    religionKey?: GameKey,
  ) {
    super(key);

    this.isCurrent = isCurrent;
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
    {
      attrName: "religionKey",
      isOptional: true,
      related: { theirKeyAttr: "playerKeys" },
    },
  ];

  /*
   * Attributes
   */
  government: Government;
  isCurrent = false;
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

  knownTileKeys = ref([] as GameKey[]);
  knownTiles = hasMany<Tile>(this.knownTileKeys, `${this.key}.knownTiles`);

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

  yields = computed(() => new Yields());

  /*
   * Actions
   */
  // todo add here
}
