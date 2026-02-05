/* eslint-disable @typescript-eslint/no-explicit-any */
import { useDataBucket } from "@/Data/useDataBucket";
import { TypeObject } from "../Static/Objects/TypeObject";
import { GameClass, GameKey, parseKey } from "@/Common/Models/_GameTypes";

export * from "./_GameTypes";

export interface ObjectWithProps {
  updateWatchers: ((changes: Partial<ObjectWithProps>) => void)[];
}

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
  key: GameKey;
  class: GameClass;
  concept: TypeObject;
  id: string;
  static attrsConf: GameObjAttr[] = [];

  protected readonly computedCache: Map<string, any> = new Map();

  // Register relation-change-post-processors here
  protected readonly relationWatchers = new Map<
    keyof this,
    ((changes: Partial<GameObject>) => void)[]
  >();

  // Register data-change-post-processors here
  protected readonly updateWatchers: ((changes: Partial<this>) => void)[] = [];

  constructor(key: GameKey) {
    this.key = key;
    const { cls, id } = parseKey(key);
    this.class = cls;
    this.concept = useDataBucket().getType(`conceptType:${this.class}`);
    this.id = id;
  }

  // Triggered after this object is created and cached in the DataBucket
  onCreate(): void {}

  // Triggered after this object is updated & cached in the DataBucket
  onUpdate(changes: Partial<this>): void {
    this.updateWatchers.forEach((watcher) => watcher(changes));
  }

  // Triggered after this object's relation is updated & cached in the DataBucket
  onRelationUpdate(relName: keyof this, changes: Partial<this>): void {
    this.relationWatchers.get(relName)?.forEach((fn) => fn(changes));
  }

  // Triggered _before_ this object is deleted from the DataBucket
  onDelete(): void {
    this.computedCache.clear();
    this.relationWatchers.clear();
    this.updateWatchers.length = 0;
  }

  get types(): Set<TypeObject> {
    return this.computed("types", () => new Set([this.concept]), { props: [] });
  }

  // Initializes a hidden cache prop to hold the computed data
  // Resets cache on watched prop update
  protected computed<ValueT, ThisT extends this>(
    cachePropName: string,
    getter: () => ValueT,
    watchers?: {
      props?: (keyof ThisT)[];
      relations?: { relName: keyof ThisT; relProps: string[] }[]; // relProps is (keyof RelatedClass)[]
    },
  ): ValueT {
    const hasCache = this.computedCache.has(cachePropName);

    if (hasCache) {
      const val = this.computedCache.get(cachePropName);
      if (val !== UNSET) return val as ValueT;
    }

    // If the cache prop doesn't exist -> this is the first call so start watching for changes
    if (!hasCache) {
      // Initialize watchers (if given)
      if (watchers?.props?.length) {
        // "When you update, let me know what changed"

        const propsSet = new Set(watchers.props);
        this.updateWatchers.push((changes) => {
          for (const prop in changes) {
            if (propsSet.has(prop as any)) {
              this.computedCache.set(cachePropName, UNSET);
              break;
            }
          }
        });
      }

      if (watchers?.relations?.length) {
        // "When this relation updates, let me know what changed"

        watchers.relations.forEach(({ relName, relProps }) => {
          const relPropsSet = new Set(relProps);

          const relationWatchers = this.relationWatchers.get(relName as keyof this) ?? [];
          relationWatchers.push((changes) => {
            for (const prop in changes) {
              if (relPropsSet.has(prop)) {
                this.computedCache.set(cachePropName, UNSET);
                break;
              }
            }
          });
          this.relationWatchers.set(relName as keyof this, relationWatchers);
        });
      }
    }

    // Get, Set & Return the val
    const val = getter();
    this.computedCache.set(cachePropName, val);
    return val;
  }

  protected relation<OutT>(keyPropName: keyof this & RelationKey, getter: () => OutT): OutT {
    return this.computed(keyPropName, getter, { props: [keyPropName] });
  }

  protected hasOne<ObjT extends GameObject>(keyPropName: keyof this & RelationKey): ObjT {
    return this.relation(keyPropName, () =>
      useDataBucket().getObject<ObjT>(this[keyPropName] as GameKey),
    );
  }

  protected canHaveOne<ObjT extends GameObject>(
    keyPropName: keyof this & RelationKey,
  ): ObjT | null {
    return this.relation(keyPropName, () =>
      this[keyPropName] ? useDataBucket().getObject<ObjT>(this[keyPropName] as GameKey) : null,
    );
  }

  protected hasMany<ObjT extends GameObject>(
    keyPropName: keyof this & RelationKey,
  ): Map<GameKey, ObjT> {
    return this.relation(keyPropName, () => {
      const objects = new Map<GameKey, ObjT>();
      (this[keyPropName] as Set<GameKey>).forEach((key) => {
        objects.set(key, useDataBucket().getObject<ObjT>(key));
      });
      return objects;
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
        out[attr.attrName] = [...value];
        continue;
      }

      // Normal attribute
      out[attr.attrName] = value;
    }

    return out;
  }
}

const UNSET = Symbol("computed-unset");

type RelationKey = `${string}Key` | `${string}Keys`;
