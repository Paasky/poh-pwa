/* eslint-disable @typescript-eslint/no-explicit-any */
import { TypeObject } from "@/types/typeObjects";
import { ObjType } from "@/types/common";
import { useDataBucket } from "@/Data/useDataBucket";
import { GameClass, GameKey, IRawGameObject, parseKey } from "@/objects/game/_keys";

export * from "@/objects/game/_keys";

export type GameObjAttr = {
  isTypeObj?: boolean;
  isTypeObjArray?: boolean;
  attrName: string;
  isOptional?: boolean;
  related?: {
    theirKeyAttr: string;
    isManyToMany?: boolean;
    isOne?: boolean;
  };
};

export class GameObject {
  // noinspection JSUnusedGlobalSymbols
  objType: ObjType = "GameObject";
  key: GameKey;
  class: GameClass;
  concept: TypeObject;
  id: string;
  static attrsConf: GameObjAttr[] = [];

  constructor(key: GameKey) {
    this.key = key;
    const { cls, id } = parseKey(key);
    this.class = cls;
    this.concept = useDataBucket().getType(`conceptType:${this.class}`);
    this.id = id;
  }

  /**
   * Called by DataStore after the object is first instantiated and added to the bucket.
   * Use this for initial side-effects (e.g. emitting "UnitCreated" events).
   */
  onCreated(): void {}

  /**
   * Called by DataStore after an Object.assign(this, rawPayload) has occurred.
   * Use this to invalidate internal caches or trigger logic that depends on changed data.
   */
  onUpdate(_changes: Partial<IRawGameObject>): void {
    this.refresh();
  }

  /**
   * Internal refresh logic to clear lazy-loading caches.
   * Extended by subclasses to clear specific computed caches.
   */
  refresh(): void {
    // Clear relation caches (e.g., _player, _tile) and custom caches
    Object.keys(this).forEach((key) => {
      if (key.startsWith("_")) {
        (this as any)[key] = undefined;
      }
    });
  }

  toJSON() {
    const out = {
      key: this.key,
    } as Record<string, unknown>;

    for (const attr of (this.constructor as typeof GameObject).attrsConf) {
      const value = (this as any)[attr.attrName];

      // Empty data: only add if not optional
      if (value === undefined || value === null) {
        if (!attr.isOptional) {
          out[attr.attrName] = value;
        }
        continue;
      }

      // Special handling for TypeObjects
      if (attr.isTypeObj) {
        out[attr.attrName] = value.key;
        continue;
      }
      if (attr.isTypeObjArray) {
        out[attr.attrName] = value.map((v: TypeObject) => v.key);
        continue;
      }

      // Special handling for Sets
      if (value instanceof Set) {
        out[attr.attrName] = Array.from(value);
        continue;
      }

      // Normal attribute
      out[attr.attrName] = value;
    }

    return out;
  }
}
