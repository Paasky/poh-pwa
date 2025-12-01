import {
  CanHaveReligion,
  HasCitizens,
  hasMany,
  HasTiles,
  HasTradeRoutes,
  HasUnits,
} from "@/objects/game/_mixins";
import { computed, ref } from "vue";
import { TypeObject } from "@/types/typeObjects";
import { TypeStorage } from "@/objects/storage";
import { Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { UnitDesign } from "@/objects/game/UnitDesign";
import { City } from "@/objects/game/City";
import { Agenda } from "@/objects/game/Agenda";
import { Deal } from "@/objects/game/Deal";
import { useObjectsStore } from "@/stores/objectStore";
import { Culture } from "@/objects/game/Culture";
import { Government } from "@/objects/player/Government";
import { Research } from "@/objects/player/Research";

export class Player extends HasCitizens(
  CanHaveReligion(HasTiles(HasTradeRoutes(HasUnits(GameObject)))),
) {
  constructor(
    key: GameKey,
    name: string,
    isCurrent = false,
    religionKey?: GameKey,
  ) {
    super(key);
    this.name = name;
    this.isCurrent = isCurrent;
    if (religionKey) this.religionKey.value = religionKey;

    this.government = new Government(key);
    this.research = new Research(key);
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "name", attrNotRef: true },
    { attrName: "isCurrent", attrNotRef: true, isOptional: true },
    {
      attrName: "religionKey",
      isOptional: true,
      related: { theirKeyAttr: "playerKeys" },
    },
  ];

  name: string;
  isCurrent = false;
  knownTypes = computed(() => [] as TypeObject[]);
  government: Government;
  research: Research;

  agendaKeys = ref([] as GameKey[]);
  agendas = hasMany(this.agendaKeys, Agenda);

  cultureKey = "" as GameKey;
  culture = computed(() => useObjectsStore().get(this.cultureKey) as Culture);

  cityKeys = ref([] as GameKey[]);
  cities = hasMany(this.cityKeys, City);

  dealKeys = ref([] as GameKey[]);
  deals = hasMany(this.dealKeys, Deal);

  designKeys = ref([] as GameKey[]);
  designs = hasMany(this.designKeys, UnitDesign);

  activeDesigns = computed(() =>
    this.designs.value.filter((d) => d.isActive.value),
  );

  knownTileKeys = ref([] as GameKey[]);

  leader = computed(() => this.culture.value.leader.value);

  storage = new TypeStorage();
  yields = computed(() => new Yields());
}
