/* eslint-disable @typescript-eslint/no-explicit-any */
import { isRef } from "vue";
import { GameClass, GameKey, GameObjAttr, GameObject, IRawGameObject, } from "@/objects/game/_GameObject";
import { Agenda } from "@/objects/game/Agenda";
import { Citizen } from "@/objects/game/Citizen";
import { City } from "@/objects/game/City";
import { Construction } from "@/objects/game/Construction";
import { Culture } from "@/objects/game/Culture";
import { Deal } from "@/objects/game/Deal";
import { Player } from "@/objects/game/Player";
import { River } from "@/objects/game/River";
import { Religion } from "@/objects/game/Religion";
import { Tile } from "@/objects/game/Tile";
import { TradeRoute } from "@/objects/game/TradeRoute";
import { Unit } from "@/objects/game/Unit";
import { UnitDesign } from "@/objects/game/UnitDesign";
import { useObjectsStore } from "@/stores/objectStore";
import { TypeKey } from "@/types/common";

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
  player: Player,
  river: River,
  religion: Religion,
  tile: Tile,
  tradeRoute: TradeRoute,
  unit: Unit,
  unitDesign: UnitDesign,
} as Record<GameClass, Ctor>;

export class GameDataLoader {
  initFromRaw(rawObjects: IRawGameObject[], bucketObjects: Map<GameKey, GameObject>): GameObject[] {
    const newObjects = [] as GameObject[];

    // Init each object
    for (const rawObjData of rawObjects) {
      if (!rawObjData.key) {
        throw new Error(`Invalid game obj data: key is missing from ${JSON.stringify(rawObjData)}`);
      }

      if (!rawObjData.key.includes(":")) {
        throw new Error(
          `Invalid game obj data: key '${rawObjData.key}' must be format '{class}:{id}'`,
        );
      }

      const objClass = rawObjData.key.split(":")[0] as GameClass;
      const config = classConf[objClass];
      if (!config) {
        throw new Error(`Invalid game obj class: undefined in config for class '${objClass}'`);
      }

      // Sanity checks pass, init the object
      const object = this._initObj(rawObjData, config);
      bucketObjects.set(object.key, object);
      newObjects.push(object);
    }

    // Build backward-relations into bucketObjects
    newObjects.forEach((obj) => this._buildBackRelations(obj, bucketObjects));

    return newObjects;
  }

  private _initObj(rawObjData: any, ctor: Ctor): GameObject {
    // Key is always the first attribute
    const attrs = [rawObjData.key];

    // Init all other attributes
    for (const attrConf of ctor.attrsConf) {
      attrs.push(this._initAttr(rawObjData, attrConf));
    }

    return new (ctor as any)(...attrs) as GameObject;
  }

  private _initAttr(rawObjData: any, config: GameObjAttr): any {
    const value = rawObjData[config.attrName];

    // Check if empty but required -> invalid data
    if (value === undefined || null) {
      if (!config.isOptional)
        throw new Error(
          `Required attribute '${config.attrName}' missing from ${JSON.stringify(rawObjData)}`,
        );

      // Just return the value
      return value;
    }

    // Convert TypeKey to TypeObject
    if (config.isTypeObj) {
      return useObjectsStore().getTypeObject(value);
    }

    // Convert TypeKeys to TypeObjects
    if (config.isTypeObjArray) {
      return value.map((d: TypeKey) => useObjectsStore().getTypeObject(d));
    }

    // Normal attribute
    return value;
  }

  private _buildBackRelations(obj: GameObject, objects: Map<GameKey, GameObject>): void {
    const ctor = obj.constructor as unknown as { attrsConf: GameObjAttr[] };
    for (const attrConf of ctor.attrsConf) {
      try {
        if (!attrConf.related) {
          continue;
        }

        // Most data is actually a ref(data) so extract the .value
        const directValue = (obj as any)[attrConf.attrName];
        const relatedKey = attrConf.attrNotRef ? directValue : directValue.value;

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
      } catch (e) {
        const msg = `GameObject.key: '${obj.key}', Attribute: ${JSON.stringify(attrConf)}, Message: ${(e as any).message}`;
        throw new Error(msg);
      }
    }
  }

  private _setToRelatedObj(
    obj: GameObject,
    relatedKey: GameKey | object,
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
    const relatedAttr = (relatedObj as any)[attrConf.related!.theirKeyAttr];
    if (attrConf.related!.isOne) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      isRef(relatedAttr)
        ? (relatedAttr.value = obj.key)
        : ((relatedObj as any)[attrConf.related!.theirKeyAttr] = obj.key);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      isRef(relatedAttr) ? (relatedAttr as any).value.push(obj.key) : relatedAttr.push(obj.key);
    }
  }
}
