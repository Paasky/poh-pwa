import { canHaveOne, hasMany } from "@/Common/Models/_Relations";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { Yields } from "@/Common/Objects/Yields";
import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import { useDataBucket } from "@/Data/useDataBucket";
import type { River } from "@/Common/Models/River";
import type { Construction } from "@/Common/Models/Construction";
import type { Citizen } from "@/Common/Models/Citizen";
import type { City } from "@/Common/Models/City";
import type { Player } from "@/Common/Models/Player";
import type { TradeRoute } from "@/Common/Models/TradeRoute";
import type { Unit } from "@/Common/Models/Unit";
import { getNeighbors, tileHeight, tileKey } from "@/helpers/mapTools";
import { Vector3 } from "@babylonjs/core";
import { tileCenter } from "@/helpers/math";
import { useCurrentContext } from "@/composables/useCurrentContext";

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
    hasMany<Citizen>(this, "citizenKeys");
    canHaveOne<City>(this, "cityKey");
    canHaveOne<Construction>(this, "constructionKey");
    canHaveOne<River>(this, "riverKey");
    hasMany<TradeRoute>(this, "tradeRouteKeys");
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
  citizenKeys = new Set<GameKey>();
  declare citizens: Citizen[];

  cityKey: GameKey | null = null;
  declare city: City | null;

  constructionKey: GameKey | null = null;
  declare construction: Construction | null;

  declare player: Player | null;

  riverKey: GameKey | null = null;
  declare river: River | null;

  tradeRouteKeys = new Set<GameKey>();
  declare tradeRoutes: TradeRoute[];

  unitKeys = new Set<GameKey>();
  declare units: Unit[];

  private _dynamicTypes: TypeObject[] = [];
  private _staticTypes: TypeObject[];
  private _staticYields: Yields;

  // Use direct array vs computed for peak-performance during Tile calc (especially A*)
  private _neighborTiles: Tile[] = [];
  get neighborTiles(): Tile[] {
    if (this._neighborTiles.length === 0) {
      this._neighborTiles = getNeighbors(
        useDataBucket().world.size,
        this,
        useDataBucket().getTiles,
        "hex",
      );
    }
    return this._neighborTiles;
  }

  private _worldPosition: Vector3 | null = null;
  get worldPosition(): Vector3 {
    if (!this._worldPosition) {
      const center = tileCenter(useDataBucket().world.size, this);
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
      (u) => u.playerKey === useCurrentContext().currentPlayer.key,
    );
    if (this.city) selectable.push(this.city);
    return selectable;
  }

  targets(player: Player, vs?: Unit): (City | Construction | Unit)[] {
    if (this.playerKey === player.key) return [];

    const targets = this.units
      .filter((unit) => unit.playerKey !== player.key)
      .sort(
        (a, b) =>
          a.yields
            .only(["yieldType:strength"], undefined, vs ? vs.types : undefined)
            .flatten()
            .getLumpAmount("yieldType:strength") -
          b.yields
            .only(["yieldType:strength"], undefined, vs ? vs.types : undefined)
            .flatten()
            .getLumpAmount("yieldType:strength"),
      ) as (City | Construction | Unit)[];

    if (this.city) targets.push(this.city);
    if (this.construction) targets.push(this.construction);

    return targets;
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
  warmUp(): void {
    // todo
  }

  // Used all over to always generate standard tile ID
  static getKey(x: number, y: number): GameKey {
    return tileKey(x, y);
  }
}
