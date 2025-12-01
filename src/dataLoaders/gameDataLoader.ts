/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Agenda,
  Citizen,
  City,
  Construction,
  Culture,
  Deal,
  GameClass,
  GameKey,
  GameObjAttr,
  GameObject,
  Player,
  Religion,
  River,
  Tile,
  TradeRoute,
  Unit,
  UnitDesign
} from "@/objects/game/gameObjects";
import { GameData } from "@/types/api";
import { useObjectsStore } from "@/stores/objectStore";

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
  private _objStore = useObjectsStore();

  load(gameData: GameData): GameObject[] {
    const objs = [] as GameObject[];

    // Init each object
    for (const rawObjData of gameData.objects) {
      if (!rawObjData.key) {
        throw new Error(
          `Invalid game obj data: key is missing from ${JSON.stringify(rawObjData)}`,
        );
      }

      if (!rawObjData.key.includes(":")) {
        throw new Error(
          `Invalid game obj data: key '${rawObjData.key}' must be format '{class}:{id}'`,
        );
      }

      const objClass = rawObjData.key.split(":")[0] as GameClass;
      const config = classConf[objClass];
      if (!config) {
        throw new Error(
          `Invalid game obj class: undefined in config for class '${objClass}'`,
        );
      }

      // Sanity checks pass, init the object
      objs.push(this._initObj(rawObjData, config));
    }

    this._objStore.bulkSet(objs);

    // Build backward-relations
    for (const obj of objs) {
      this._buildBackRelations(obj);
    }

    return objs;
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
      return this._objStore.get(value);
    }

    // Convert TypeKeys to TypeObjects
    if (config.isTypeObjArray) {
      return value.map((d: GameKey) => this._objStore.get(d));
    }

    // Normal attribute
    return value;
  }

  private _buildBackRelations(obj: GameObject): void {
    const ctor = obj.constructor as unknown as { attrsConf: GameObjAttr[] };
    for (const attrConf of ctor.attrsConf) {
      try {
        if (!attrConf.related) {
          continue;
        }

        // Most data is actually a ref(data) so extract the .value
        const directValue = (obj as any)[attrConf.attrName];
        const value = attrConf.attrNotRef ? directValue : directValue.value;

        if (value === undefined || value === null) {
          if (!attrConf.isOptional) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(
              `Required attribute ${JSON.stringify(attrConf)} missing from ${JSON.stringify(obj)}`,
            );
          }
          continue;
        }

        const relatedObj = this._objStore.get(value);

        if (attrConf.related.isOne) {
          (relatedObj as any)[attrConf.related.theirKeyAttr] = obj.key;
        } else {
          (relatedObj as any)[attrConf.related.theirKeyAttr].push(obj.key);
        }
      } catch (e) {
        const msg = `obj: ${obj.key}, conf: ${JSON.stringify(attrConf)}, msg: ${(e as any).message}`;
        throw new Error(msg);
      }
    }
  }
}
