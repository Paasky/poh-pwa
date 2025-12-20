import { useObjectsStore } from "@/stores/objectStore";
import { TypeObject } from "@/types/typeObjects";
import { ObjType } from "@/types/common";

export type GameClass =
  | "agenda"
  | "citizen"
  | "city"
  | "construction"
  | "culture"
  | "deal"
  | "river"
  | "player"
  | "religion"
  | "tile"
  | "tradeRoute"
  | "unit"
  | "unitDesign";

export type GameKey = `${GameClass}:${string}`;

export const generateKey = (cls: GameClass) => getKey(cls, crypto.randomUUID());
export const getKey = (cls: GameClass, id: string): GameKey => `${cls}:${id}`;

export type GameObjAttr = {
  isTypeObj?: boolean;
  isTypeObjArray?: boolean;
  attrName: string;
  attrNotRef?: boolean;
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
    const classAndId = key.split(":");
    this.class = classAndId[0] as GameClass;
    this.concept = useObjectsStore().getTypeObject(`conceptType:${this.class}`);
    this.id = classAndId[1];
  }

  toJSON() {
    const out = {
      key: this.key,
    } as Record<string, unknown>;

    for (const attr of (this.constructor as typeof GameObject).attrsConf) {
      // Most data is actually a ref(data) so extract the .value
      // eslint-disable-next-line
      const directValue = (this as any)[attr.attrName];

      // Quick data integrity check
      if (
        !attr.attrNotRef &&
        (!directValue || !(typeof directValue === "object" && "value" in directValue))
      ) {
        throw new Error(`Expected ${attr.attrName} to be a ref`);
      }
      const value = attr.attrNotRef ? directValue : directValue.value;

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
