import { canHaveOne, hasMany } from "@/Common/Models/_Relations";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { tileYieldTypeKeys, Yield, Yields } from "@/Common/Objects/Yields";
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
    public route: TypeObject | null = null,
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
    { attrName: "route", isOptional: true, isTypeObj: true },
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

  // Use direct array vs computed for peak-performance during Tile calc (especially A*)
  private _neighborTiles: Tile[] = [];
  get neighborTiles(): Tile[] {
    if (this._neighborTiles.length === 0) {
      this._neighborTiles = getNeighbors(
        useDataBucket().world.size,
        this,
        useDataBucket().getTiles(),
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

  // My Types (not inherited)
  get myTypes(): Set<TypeObject> {
    return this.computed(
      "_myTypes",
      () => {
        const types = new Set<TypeObject>([
          this.concept,
          this.domain,
          this.area,
          this.climate,
          this.terrain,
          this.elevation,
        ]);
        if (this.naturalWonder) types.add(this.naturalWonder);
        if (this.feature) types.add(this.feature);
        if (this.resource) types.add(this.resource);
        if (this.pollution) types.add(this.pollution);
        if (this.construction) this.construction.types.forEach((type) => types.add(type));
        // todo: if (this.route) types.add(this.route);

        // Special Land types
        if (this.domain.id === "land" && this.elevation.id === "flat")
          types.add(useDataBucket().getType("conceptType:flatLand"));
        if (this.elevation.id === "mountain" || this.elevation.id === "snowMountain")
          types.add(useDataBucket().getType("conceptType:mountain"));

        // Special Water types
        if (this.river) types.add(this.river.concept);
        if (this.isMajorRiver) types.add(useDataBucket().getType("conceptType:navigableRiver"));
        if (this.isFresh) types.add(useDataBucket().getType("conceptType:freshWater"));
        if (this.isSalt) types.add(useDataBucket().getType("conceptType:saltWater"));

        return types;
      },
      ["feature", "resource", "pollution", "constructionKey"],
    );
  }

  // Types a Citizen inherits from me
  get typesForCitizen(): Set<TypeObject> {
    return this.computed(
      "_typesForCitizen",
      () => {
        const types = new Set<TypeObject>();
        if (this.naturalWonder) types.add(this.naturalWonder);
        if (this.construction) this.construction.types.forEach((type) => types.add(type));
        return types;
      },
      ["constructionKey"],
    );
  }

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "_yields",
      () => {
        const yieldsForMe = (yields: Yields): Yield[] => {
          return yields.only(tileYieldTypeKeys, this.myTypes).all();
        };

        // Tile Yields are from my Types + Construction + Player Mods
        const yields = new Yields();
        this.myTypes.forEach((type) => yields.add(...yieldsForMe(type.yields)));
        if (this.construction) yields.add(...yieldsForMe(this.construction.yields));
        if (this.city) yields.add(...yieldsForMe(this.city.yieldMods));

        // Flatten Yields to apply modifiers
        return yields.flatten();
      },
      ["feature", "resource", "pollution", "constructionKey", "playerKey"],
    );
  }

  // Used all over to always generate standard tile ID
  static getKey(x: number, y: number): GameKey {
    return tileKey(x, y);
  }
}
