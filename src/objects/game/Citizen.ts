import { canHaveOne, hasOne } from "@/objects/game/_mixins";
import { TypeObject } from "@/types/typeObjects";
import { computed, ref } from "vue";
import { Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import { City } from "@/objects/game/City";
import { Culture } from "@/objects/game/Culture";
import { Player } from "@/objects/game/Player";
import { Religion } from "@/objects/game/Religion";
import { Tile } from "@/objects/game/Tile";

export class Citizen extends GameObject {
  constructor(
    key: GameKey,
    cityKey: GameKey,
    cultureKey: GameKey,
    tileKey: GameKey,
    religionKey: GameKey | null = null,
    policy: TypeObject | null = null,
  ) {
    super(key);
    this.cityKey = cityKey;
    this.cultureKey.value = cultureKey;
    this.tileKey.value = tileKey;
    if (religionKey) this.religionKey.value = religionKey;
    if (policy) this.policy.value = policy;
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "cityKey", attrNotRef: true, related: { theirKeyAttr: "citizenKeys" } },
    { attrName: "cultureKey", related: { theirKeyAttr: "citizenKeys" } },
    { attrName: "tileKey", related: { theirKeyAttr: "citizenKeys" } },
    {
      attrName: "religionKey",
      isOptional: true,
      related: { theirKeyAttr: "citizenKeys" },
    },
    { attrName: "policy", isOptional: true, isTypeObj: true },
  ];

  cityKey = "" as GameKey;
  city = computed(() => useObjectsStore().get(this.cityKey) as City);

  cultureKey = ref("" as GameKey);
  culture = hasOne(this.cultureKey, Culture);

  playerKey = ref<GameKey>("" as GameKey);
  player = hasOne(this.playerKey, Player);

  religionKey = ref(null as GameKey | null);
  religion = canHaveOne(this.religionKey, Religion);

  tileKey = ref("" as GameKey);
  tile = hasOne(this.tileKey, Tile);

  policy = ref<TypeObject | null>(null);

  work = computed(() => this.tile.value.construction.value);

  private _tileYields = computed(() =>
    this.tile.value.yields.value.only(this.concept.inheritYieldTypes!, [this.concept]),
  );

  private _workYields = computed(
    (): Yields | null =>
      this.work.value?.yields.value.only(this.concept.inheritYieldTypes!, [this.concept]) ?? null,
  );

  yields = computed(
    () => new Yields([...this._tileYields.value.all(), ...(this._workYields.value?.all() ?? [])]),
  );
}
