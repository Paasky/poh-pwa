import {
  CanHaveReligion,
  HasCity,
  HasCulture,
  HasPlayer,
  HasTile,
} from "@/objects/game/_mixins";
import { TypeObject } from "@/types/typeObjects";
import { computed, ref } from "vue";
import { Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";

export class Citizen extends HasCity(
  HasCulture(CanHaveReligion(HasPlayer(HasTile(GameObject)))),
) {
  constructor(
    key: GameKey,
    cityKey: GameKey,
    cultureKey: GameKey,
    tileKey: GameKey,
    religionKey: GameKey | null = null,
    policy: TypeObject | null = null,
  ) {
    super(key);
    this.cityKey.value = cityKey;
    this.cultureKey.value = cultureKey;
    this.tileKey.value = tileKey;
    if (religionKey) this.religionKey.value = religionKey;
    if (policy) this.policy.value = policy;
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "cityKey", related: { theirKeyAttr: "citizenKeys" } },
    { attrName: "cultureKey", related: { theirKeyAttr: "citizenKeys" } },
    { attrName: "tileKey", related: { theirKeyAttr: "citizenKeys" } },
    {
      attrName: "religionKey",
      isOptional: true,
      related: { theirKeyAttr: "citizenKeys" },
    },
    { attrName: "policy", isOptional: true, isTypeObj: true },
  ];

  policy = ref<TypeObject | null>(null);

  work = computed(() => this.tile.value.construction.value);

  private _tileYields = computed(() =>
    this.tile.value.yields.value.only(this.concept.inheritYieldTypes!, [
      this.concept,
    ]),
  );

  private _workYields = computed(
    (): Yields | null =>
      this.work.value?.yields.value.only(this.concept.inheritYieldTypes!, [
        this.concept,
      ]) ?? null,
  );

  yields = computed(
    () =>
      new Yields([
        ...this._tileYields.value.all(),
        ...(this._workYields.value?.all() ?? []),
      ]),
  );
}
