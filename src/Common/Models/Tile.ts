import { TypeObject } from "../Static/Objects/TypeObject";
import { tileYieldTypeKeys, Yield, Yields } from "../Static/Objects/Yields";
import { GameKey, GameObjAttr, GameObject } from "./_GameModel";
import { useDataBucket } from "@/Data/useDataBucket";
import type { River } from "./River";
import type { Construction } from "./Construction";
import type { Citizen } from "./Citizen";
import type { City } from "./City";
import type { Player } from "./Player";
import type { TradeRoute } from "./TradeRoute";
import type { Unit } from "./Unit";
import { getNeighbors, tileHeight, tileKey } from "../Helpers/mapTools";
import { Vector3 } from "@babylonjs/core";
import { tileCenter } from "../Helpers/math";

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
  get citizens(): Map<GameKey, Citizen> {
    return this.hasMany<Citizen>("citizenKeys");
  }

  cityKey: GameKey | null = null;
  get city(): City | null {
    return this.canHaveOne<City>("cityKey");
  }

  constructionKey: GameKey | null = null;
  get construction(): Construction | null {
    return this.canHaveOne<Construction>("constructionKey");
  }

  get player(): Player {
    return this.hasOne<Player>("playerKey");
  }

  riverKey: GameKey | null = null;
  get river(): River | null {
    return this.canHaveOne<River>("riverKey");
  }

  tradeRouteKeys = new Set<GameKey>();
  get tradeRoutes(): Map<GameKey, TradeRoute> {
    return this.hasMany<TradeRoute>("tradeRouteKeys");
  }

  unitKeys = new Set<GameKey>();
  get units(): Map<GameKey, Unit> {
    return this.hasMany<Unit>("unitKeys");
  }

  /*
   * Computed
   */

  get freeCitizenSlotCount(): number {
    return this.computed(
      "freeCitizenSlotCount",
      () => Math.max(0, this.yields.getLumpAmount("yieldType:citizenSlot") - this.citizenKeys.size),
      {
        props: ["citizenKeys"],
        relations: [
          {
            relName: "construction",
            relProps: ["health", "progress", "type"],
          },
        ],
      },
    );
  }

  // My Types (not inherited)
  get myTypes(): Set<TypeObject> {
    return this.computed(
      "myTypes",
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
      {
        props: ["feature", "resource", "pollution", "constructionKey"],
        relations: [{ relName: "construction", relProps: ["types"] }],
      },
    );
  }

  get neighborTiles(): Tile[] {
    return this.computed("neighborTiles", () =>
      getNeighbors(useDataBucket().world.size, this, useDataBucket().getTiles(), "hex"),
    );
  }

  // Types a Citizen inherits from me
  get typesForCitizen(): Set<TypeObject> {
    return this.computed(
      "typesForCitizen",
      () => {
        const types = new Set<TypeObject>();
        if (this.naturalWonder) types.add(this.naturalWonder);
        if (this.construction) this.construction.types.forEach((type) => types.add(type));
        return types;
      },
      {
        props: ["constructionKey"],
        relations: [{ relName: "construction", relProps: ["types"] }],
      },
    );
  }

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "yields",
      () => {
        const yieldsForMe = (yields: Yields): Yield[] => {
          return yields.only(tileYieldTypeKeys, this.myTypes).all();
        };

        // Tile Yields are from my Types + Construction + Actor Mods
        const yields = new Yields();
        this.myTypes.forEach((type) => yields.add(...yieldsForMe(type.yields)));
        if (this.construction) yields.add(...yieldsForMe(this.construction.yields));
        if (this.city) yields.add(...yieldsForMe(this.city.yieldMods));

        // Flatten Yields to apply modifiers
        return yields.flatten();
      },
      {
        props: ["feature", "resource", "pollution", "constructionKey", "playerKey"],
        relations: [
          { relName: "construction", relProps: ["yields"] },
          { relName: "city", relProps: ["yieldMods"] },
        ],
      },
    );
  }

  get worldPosition(): Vector3 {
    return this.computed("worldPosition", () => {
      const center = tileCenter(useDataBucket().world.size, this);
      return new Vector3(center.x, tileHeight(this, true), center.z);
    });
  }

  warmUp(): void {}

  // Used all over to always generate standard tile ID
  static getKey(x: number, y: number): GameKey {
    return tileKey(x, y);
  }
}
