import {
  CanHaveCity,
  canHaveOne,
  CanHavePlayer,
  HasCitizens,
  HasTradeRoutes,
  HasUnits,
} from "@/objects/game/_mixins";
import { TypeObject } from "@/types/typeObjects";
import { Yields } from "@/objects/yield";
import { computed, ref } from "vue";
import {
  GameKey,
  GameObjAttr,
  GameObject,
  getKey,
} from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import { River } from "@/objects/game/River";
import { Construction } from "@/objects/game/Construction";

export class Tile extends HasCitizens(
  CanHaveCity(CanHavePlayer(HasTradeRoutes(HasUnits(GameObject)))),
) {
  constructor(
    key: GameKey,
    x: number,
    y: number,
    domain: TypeObject,
    area: TypeObject,
    climate: TypeObject,
    terrain: TypeObject,
    elevation: TypeObject,
    feature: TypeObject | null = null,
    resource: TypeObject | null = null,
    naturalWonder: TypeObject | null = null,
    pollution: TypeObject | null = null,
    playerKey: GameKey | null = null,
  ) {
    super(key);
    this.x = x;
    this.y = y;
    this.domain = domain;
    this.area = area;
    this.climate = climate;
    this.terrain = terrain;
    this.elevation = elevation;
    if (feature) this.feature.value = feature;
    if (resource) this.resource.value = resource;
    if (naturalWonder) this.naturalWonder = naturalWonder;
    if (pollution) this.pollution.value = pollution;
    if (playerKey) this.playerKey.value = playerKey;

    this._staticTypes = [domain, area, terrain, elevation];
    if (this.naturalWonder) this._staticTypes.push(this.naturalWonder);

    this._staticYields = new Yields(
      this._staticTypes.flatMap((t) => t.yields.all()),
    );
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "x", attrNotRef: true },
    { attrName: "y", attrNotRef: true },
    { attrName: "domain", attrNotRef: true, isTypeObj: true },
    { attrName: "area", attrNotRef: true, isTypeObj: true },
    { attrName: "climate", attrNotRef: true, isTypeObj: true },
    { attrName: "terrain", attrNotRef: true, isTypeObj: true },
    { attrName: "elevation", attrNotRef: true, isTypeObj: true },
    { attrName: "feature", isOptional: true, isTypeObj: true },
    { attrName: "resource", isOptional: true, isTypeObj: true },
    {
      attrName: "naturalWonder",
      isOptional: true,
      attrNotRef: true,
      isTypeObj: true,
    },
    { attrName: "pollution", isOptional: true, isTypeObj: true },
    {
      attrName: "playerKey",
      isOptional: true,
      related: { theirKeyAttr: "tileKeys" },
    },
  ];

  x: number;
  y: number;
  domain: TypeObject;
  area: TypeObject;
  climate: TypeObject;
  terrain: TypeObject;
  elevation: TypeObject;
  feature = ref<TypeObject | null>(null);
  resource = ref<TypeObject | null>(null);
  pollution = ref<TypeObject | null>(null);
  naturalWonder = null as TypeObject | null;
  isFresh = false;
  isMajorRiver = false;
  isSalt = false;

  constructionKey = ref<GameKey | null>(null);
  construction = canHaveOne(this.constructionKey, Construction);

  riverKey: GameKey | null = null;
  river = computed(() =>
    this.riverKey ? (useObjectsStore().get(this.riverKey) as River) : null,
  );

  private _staticTypes: TypeObject[];
  private _dynamicTypes: TypeObject[] = [];
  private _staticYields: Yields;

  types = computed(() => {
    this._dynamicTypes.length = 0;

    if (this.feature.value)
      this._dynamicTypes.push(this.feature.value as TypeObject);
    if (this.resource.value)
      this._dynamicTypes.push(this.resource.value as TypeObject);
    if (this.pollution.value)
      this._dynamicTypes.push(this.pollution.value as TypeObject);

    return this._staticTypes.concat(this._dynamicTypes);
  });

  yields = computed(
    () =>
      new Yields([
        ...this._staticYields.all(),
        ...this._dynamicTypes.flatMap((t) => t.yields.all()),
      ]),
  );

  static getKey(x: number, y: number): GameKey {
    return getKey("tile", `x${x},y${y}`);
  }
}
