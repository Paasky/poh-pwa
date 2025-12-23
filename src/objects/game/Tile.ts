/* eslint-disable @typescript-eslint/no-unused-expressions */
import { canHaveOne, hasMany } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { Yields } from "@/objects/yield";
import { computed, ref } from "vue";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import type { River } from "@/objects/game/River";
import type { Construction } from "@/objects/game/Construction";
import type { Citizen } from "@/objects/game/Citizen";
import type { City } from "@/objects/game/City";
import type { Player } from "@/objects/game/Player";
import type { TradeRoute } from "@/objects/game/TradeRoute";
import type { Unit } from "@/objects/game/Unit";
import { getNeighbors, tileHeight, tileKey } from "@/helpers/mapTools";
import { Vector3 } from "@babylonjs/core";
import { tileCenter } from "@/helpers/math";

// TODO: Centralize tile mutations in a TileManager to trigger useMoveCostCache().resetCache([tile.key])
export class Tile extends GameObject {
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

    this._staticYields = new Yields(this._staticTypes.flatMap((t) => t.yields.all()));
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

  /*
   * Attributes
   */
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

  private _dynamicTypes: TypeObject[] = [];
  private _staticTypes: TypeObject[];
  private _staticYields: Yields;

  // Use direct array vs computed for peak-performance during Tile calc (especially A*)
  private _neighborTiles: Tile[] = [];
  get neighborTiles(): Tile[] {
    if (this._neighborTiles.length === 0) {
      this._neighborTiles = getNeighbors(
        useObjectsStore().world.size,
        this,
        useObjectsStore().getTiles,
        "hex",
      );
    }
    return this._neighborTiles;
  }

  private _worldPosition: Vector3 | null = null;
  get worldPosition(): Vector3 {
    if (!this._worldPosition) {
      const center = tileCenter(useObjectsStore().world.size, this);
      const height = tileHeight(this, true); // Logic height
      this._worldPosition = new Vector3(center.x, height, center.z);
    }
    return this._worldPosition;
  }

  /*
   * Relations
   */
  citizenKeys = ref([] as GameKey[]);
  citizens = hasMany<Citizen>(this.citizenKeys, `${this.key}.citizens`);

  cityKey = ref(null as GameKey | null);
  city = canHaveOne<City>(this.cityKey, `${this.key}.city`);

  constructionKey = ref<GameKey | null>(null);
  construction = canHaveOne<Construction>(this.constructionKey, `${this.key}.construction`);

  playerKey = ref<GameKey | null>(null);
  player = canHaveOne<Player>(this.playerKey, `${this.key}.player`);

  riverKey: GameKey | null = null;
  river = computed(() => (this.riverKey ? (useObjectsStore().get(this.riverKey) as River) : null));

  tradeRouteKeys = ref([] as GameKey[]);
  tradeRoutes = hasMany<TradeRoute>(this.tradeRouteKeys, `${this.key}.tradeRoutes`);

  unitKeys = ref([] as GameKey[]);
  units = hasMany<Unit>(this.unitKeys, `${this.key}.units`);

  /*
   * Computed
   */
  selectable = computed(() => {
    const selectable = this.units.value.filter(
      (u) => u.playerKey.value === useObjectsStore().currentPlayer.key,
    ) as (City | Unit)[];
    if (this.cityKey) selectable.push(this.city.value!);
    return selectable;
  });

  types = computed(() => {
    this._dynamicTypes.length = 0;

    if (this.feature.value) this._dynamicTypes.push(this.feature.value as TypeObject);
    if (this.resource.value) this._dynamicTypes.push(this.resource.value as TypeObject);
    if (this.pollution.value) this._dynamicTypes.push(this.pollution.value as TypeObject);

    return this._staticTypes.concat(this._dynamicTypes);
  });

  yields = computed(
    () =>
      new Yields([
        ...this._staticYields.all(),
        ...this._dynamicTypes.flatMap((t) => t.yields.all()),
      ]),
  );

  /*
   * Actions
   */
  warmUp(): void {
    this.city.value;
    this.construction.value;
    this.player.value;
    this.river.value;
    this.selectable.value;
    this.tradeRoutes.value;
    this.units.value;
    this.types.value;
    this.yields.value;

    this.neighborTiles;
    this.worldPosition;
  }

  // Used all over to always generate standard tile ID
  static getKey(x: number, y: number): GameKey {
    return tileKey(x, y);
  }
}
