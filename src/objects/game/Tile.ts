import { canHaveOne, hasMany } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { Yields } from "@/objects/yield";
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
    public x: number,
    public y: number,
    public domain: TypeObject,
    public area: TypeObject,
    public climate: TypeObject,
    public terrain: TypeObject,
    public elevation: TypeObject,
    public feature: TypeObject | null = null,
    public resource: TypeObject | null = null,
    public naturalWonder: TypeObject | null = null,
    public pollution: TypeObject | null = null,
    public playerKey: GameKey | null = null,
  ) {
    super(key);

    canHaveOne<Player>(this, "playerKey");

    this.citizenKeys = [];
    hasMany<Citizen>(this, "citizenKeys");

    this.cityKey = null;
    canHaveOne<City>(this, "cityKey");

    this.constructionKey = null;
    canHaveOne<Construction>(this, "constructionKey");

    this.riverKey = null;
    canHaveOne<River>(this, "riverKey");

    this.tradeRouteKeys = [];
    hasMany<TradeRoute>(this, "tradeRouteKeys");

    this.unitKeys = [];
    hasMany<Unit>(this, "unitKeys");

    this._staticTypes = [domain, area, terrain, elevation];
    if (this.naturalWonder) this._staticTypes.push(this.naturalWonder);

    this._staticYields = new Yields(this._staticTypes.flatMap((t) => t.yields.all()));
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "x" },
    { attrName: "y" },
    { attrName: "domain", isTypeObj: true },
    { attrName: "area", isTypeObj: true },
    { attrName: "climate", isTypeObj: true },
    { attrName: "terrain", isTypeObj: true },
    { attrName: "elevation", isTypeObj: true },
    { attrName: "feature", isOptional: true, isTypeObj: true },
    { attrName: "resource", isOptional: true, isTypeObj: true },
    {
      attrName: "naturalWonder",
      isOptional: true,
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
  isFresh = false;
  isMajorRiver = false;
  isSalt = false;

  /*
   * Relations
   */
  citizenKeys: GameKey[];
  declare citizens: Citizen[];

  cityKey: GameKey | null;
  declare city: City | null;

  constructionKey: GameKey | null;
  declare construction: Construction | null;

  declare player: Player | null;

  riverKey: GameKey | null;
  declare river: River | null;

  tradeRouteKeys: GameKey[];
  declare tradeRoutes: TradeRoute[];

  unitKeys: GameKey[];
  declare units: Unit[];

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
   * Computed
   */
  get selectable(): (City | Unit)[] {
    const selectable: (City | Unit)[] = this.units.filter(
      (u) => u.playerKey === useObjectsStore().currentPlayer.key,
    );
    if (this.city) selectable.push(this.city);
    return selectable;
  }

  get types(): TypeObject[] {
    this._dynamicTypes.length = 0;

    if (this.feature) this._dynamicTypes.push(this.feature);
    if (this.resource) this._dynamicTypes.push(this.resource);
    if (this.pollution) this._dynamicTypes.push(this.pollution);

    return this._staticTypes.concat(this._dynamicTypes);
  }

  get yields(): Yields {
    return new Yields([
      ...this._staticYields.all(),
      ...this.types.slice(this._staticTypes.length).flatMap((t) => t.yields.all()),
    ]);
  }

  /*
   * Actions
   */

  // Used all over to always generate standard tile ID
  static getKey(x: number, y: number): GameKey {
    return tileKey(x, y);
  }
}
