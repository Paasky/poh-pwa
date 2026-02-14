/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import {
  type GameClass,
  type GameKey,
  type IRawGameObject,
  parseKey,
} from "@/Common/Models/_GameTypes";
import { Agenda } from "@/Common/Models/Agenda";
import { Citizen } from "@/Common/Models/Citizen";
import { City } from "@/Common/Models/City";
import { Construction } from "@/Common/Models/Construction";
import { Culture } from "@/Common/Models/Culture";
import { Deal } from "@/Common/Models/Deal";
import { Player } from "@/Common/Models/Player";
import { River } from "@/Common/Models/River";
import { Religion } from "@/Common/Models/Religion";
import { Tile } from "@/Common/Models/Tile";
import { TradeRoute } from "@/Common/Models/TradeRoute";
import { Unit } from "@/Common/Models/Unit";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import type { DataBucket } from "@/Data/DataBucket";
import { Diplomacy } from "@/Common/Objects/Diplomacy";
import { Government } from "@/Common/Models/Government";
import { Incident } from "@/Common/Models/Incident";
import { Research } from "@/Common/Models/Research"; // Constructor type that also exposes the static attrsConf declared on each GameObject subclass

// Constructor type that also exposes the static attrsConf declared on each GameObject subclass
type Ctor<T = GameObject> = {
  new (...args: any[]): T;
  attrsConf: GameObjAttr[];
};

const classConf = {
  agenda: Agenda,
  citizen: Citizen,
  city: City,
  construction: Construction,
  culture: Culture,
  deal: Deal,
  diplomacy: Diplomacy,
  government: Government,
  incident: Incident,
  player: Player,
  river: River,
  religion: Religion,
  research: Research,
  tile: Tile,
  tradeRoute: TradeRoute,
  unit: Unit,
  unitDesign: UnitDesign,
} as Record<GameClass, Ctor>;

export class GameDataLoader {
  constructor(private readonly dataBucket: DataBucket) {}

  setFromRaw(
    rawObjects: IRawGameObject[],
    bucketObjects: Map<GameKey, GameObject>,
  ): { created: GameObject[]; updated: GameObject[] } {
    const createdObjects: GameObject[] = [];
    const updatedObjects: GameObject[] = [];
    const updatedDataPerGameKey: Map<GameKey, IRawGameObject> = new Map();

    // Upsert Objects
    for (const rawObjData of rawObjects) {
      const config = this._getClassConfig(rawObjData);
      let object = bucketObjects.get(rawObjData.key);

      if (object) {
        this._updateObjAttrs(object, rawObjData, config, bucketObjects);
        updatedObjects.push(object);
        updatedDataPerGameKey.set(object.key, rawObjData);
      } else {
        object = this._initObj(rawObjData, config);
        bucketObjects.set(object.key, object);
        createdObjects.push(object);
      }
    }

    // Build back relations
    createdObjects.forEach((obj) => this._buildBackRelations(obj, bucketObjects));
    updatedObjects.forEach((obj) =>
      this._buildBackRelations(obj, bucketObjects, updatedDataPerGameKey.get(obj.key)!),
    );

    return { created: createdObjects, updated: updatedObjects };
  }

  public buildBackRelations(objects: GameObject[], bucketObjects: Map<GameKey, GameObject>): void {
    objects.forEach((obj) => this._buildBackRelations(obj, bucketObjects));
  }

  public removeRelations(obj: GameObject, objects: Map<GameKey, GameObject>): void {
    const ctor = obj.constructor as unknown as { attrsConf: GameObjAttr[] };
    for (const attrConf of ctor.attrsConf) {
      // Not a relation -> ignore
      if (!attrConf.related) continue;

      const relatedKey = (obj as any)[attrConf.attrName] as null | GameKey | Set<GameKey>;

      // Relation is null -> ignore
      if (!relatedKey) continue;

      // Remove from related object(s)
      if (relatedKey instanceof Set) {
        relatedKey.forEach((key) => this._removeFromRelatedObj(obj, key, attrConf, objects));
      } else {
        this._removeFromRelatedObj(obj, relatedKey, attrConf, objects);
      }
    }
  }
  private _getClassConfig(rawObjData: IRawGameObject): Ctor {
    if (!rawObjData.key) {
      throw new Error(`Invalid game obj data: key is missing from ${JSON.stringify(rawObjData)}`);
    }

    const { cls } = parseKey(rawObjData.key);

    const config = classConf[cls];
    if (!config) {
      throw new Error(`Invalid game obj class: undefined in config for class '${cls}'`);
    }

    return config;
  }

  private _initObj(rawObjData: IRawGameObject, config: Ctor): GameObject {
    // Key is always the first attribute
    const attrs = [rawObjData.key];

    // Init all other attributes
    for (const attrConf of config.attrsConf) {
      attrs.push(this._initAttr(rawObjData, attrConf));
    }

    return new (config as any)(...attrs) as GameObject;
  }

  private _updateObjAttrs(
    object: GameObject,
    rawObjData: IRawGameObject,
    config: Ctor,
    objects: Map<GameKey, GameObject>,
  ): void {
    for (const attrConf of config.attrsConf) {
      // Not in raw data -> ignore
      if (!(attrConf.attrName in rawObjData)) continue;

      const oldValue = (object as any)[attrConf.attrName];

      // Remove old relation(s)
      if (attrConf.related && oldValue) {
        if (oldValue instanceof Set) {
          oldValue.forEach((key) => this._removeFromRelatedObj(object, key, attrConf, objects));
        } else {
          this._removeFromRelatedObj(object, oldValue, attrConf, objects);
        }
      }

      // Set to object
      (object as any)[attrConf.attrName] = this._initAttr(rawObjData, attrConf);
    }
  }

  private _initAttr(rawObjData: any, config: GameObjAttr): any {
    const value = rawObjData[config.attrName];

    // Check if empty
    if (value === undefined || value === null) {
      // Required -> throw
      if (!config.isOptional)
        throw new Error(
          `Required attribute '${config.attrName}' missing from ${JSON.stringify(rawObjData)}`,
        );

      // Optional -> return raw value (null or undefined)
      return value;
    }

    // Convert TypeKey to TypeObject
    if (config.isTypeObj) {
      return this.dataBucket.getType(value);
    }

    // Convert TypeKeys to TypeObjects
    if (config.isTypeObjArray) {
      return value.map((d: TypeKey) => this.dataBucket.getType(d));
    }

    // Convert relation arrays to Sets
    if (config.related && Array.isArray(value)) {
      return new Set<GameKey>(value);
    }

    // Normal attribute
    return value;
  }

  private _removeFromRelatedObj(
    obj: GameObject,
    relatedKey: GameKey,
    attrConf: GameObjAttr,
    objects: Map<GameKey, GameObject>,
  ): void {
    const relatedObj = objects.get(relatedKey);

    // Related object doesn't exist -> ignore (already gone)
    if (!relatedObj) return;

    const theirKeyAttr = attrConf.related!.theirKeyAttr;
    const theirRelationAttrValue = (relatedObj as any)[theirKeyAttr] as
      | null
      | GameKey
      | Set<GameKey>;

    // Their relation to us is null -> ignore
    if (!theirRelationAttrValue) return;

    if (theirRelationAttrValue instanceof Set) {
      // Their value is a Set of keys -> remove me from it
      theirRelationAttrValue.delete(obj.key);
    } else if (theirRelationAttrValue === obj.key) {
      // Their value is my key -> set it to null
      (relatedObj as any)[theirKeyAttr] = null;
    }
  }

  private _buildBackRelations(
    obj: GameObject,
    objects: Map<GameKey, GameObject>,
    updatedData?: IRawGameObject,
  ): void {
    const ctor = obj.constructor as unknown as { attrsConf: GameObjAttr[] };
    for (const attrConf of ctor.attrsConf) {
      // Not a relation -> ignore
      if (!attrConf.related) {
        continue;
      }

      // It was an update, and this relation was not updated -> ignore
      if (updatedData && !(attrConf.attrName in updatedData)) {
        continue;
      }

      const relatedKey = (obj as any)[attrConf.attrName];

      if (relatedKey === undefined || relatedKey === null) {
        if (!attrConf.isOptional) {
          // noinspection ExceptionCaughtLocallyJS
          throw new Error(
            `Required attribute for ${JSON.stringify(attrConf)} missing in raw data: ${JSON.stringify(obj)}`,
          );
        }
        continue;
      }
      if (attrConf.related.isManyToMany) {
        for (const relatedSingleKey of relatedKey) {
          this._setToRelatedObj(obj, relatedSingleKey as GameKey, attrConf, objects);
        }
      } else {
        this._setToRelatedObj(obj, relatedKey as GameKey, attrConf, objects);
      }
    }
  }

  private _setToRelatedObj(
    obj: GameObject,
    relatedKey: GameKey,
    attrConf: GameObjAttr,
    objects: Map<GameKey, GameObject>,
  ): void {
    // The key of the related must be a string
    // noinspection SuspiciousTypeOfGuard
    if (typeof relatedKey !== "string") {
      throw new Error(
        `Invalid related key data type "${typeof relatedKey}". Raw data ${JSON.stringify(obj)}`,
      );
    }

    const relatedObj = objects.get(relatedKey);
    if (!relatedObj) {
      throw new Error(
        `Related object '${relatedKey}' does not exist. Raw data: ${JSON.stringify(obj)}`,
      );
    }

    // Load the related obj.attr
    const theirKeyAttr = attrConf.related!.theirKeyAttr;
    const theirRelationAttrValue = (relatedObj as any)[theirKeyAttr] as
      | null
      | GameKey
      | Set<GameKey>;

    if (theirRelationAttrValue instanceof Set) {
      theirRelationAttrValue.add(obj.key);
    } else {
      (relatedObj as any)[theirKeyAttr] = obj.key;
    }
  }
}
