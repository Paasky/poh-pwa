/* eslint-disable @typescript-eslint/no-explicit-any */
// noinspection JSUnusedLocalSymbols

import { GameKey, GameObject, ObjectWithProps } from "@/Common/Models/_GameModel";
import { useDataBucket } from "@/Data/useDataBucket";

export function hasMany<T extends GameObject>(instance: any, relationKey: RelationKey) {
  const { getterName, propName } = setPrivateProp(instance, relationKey);

  // Initialize the private cache property
  instance[propName] = undefined;

  Object.defineProperty(instance, getterName, {
    get() {
      if (this[propName] === undefined) {
        instance[propName] = new Map<GameKey, T>();
        (this[relationKey] as Set<GameKey>).forEach((key) => {
          this[propName].set(key, useDataBucket().getObject<T>(key));
        });
      }
      return this[propName];
    },
    enumerable: true,
    configurable: true,
  });
}

export function hasOne<T extends GameObject>(instance: any, relationKey: RelationKey) {
  const { getterName, propName } = setPrivateProp(instance, relationKey);

  // Initialize the private cache property
  instance[propName] = undefined;

  Object.defineProperty(instance, getterName, {
    get() {
      if (this[propName] === undefined) {
        const key = this[relationKey] as GameKey;
        if (!key) {
          throw new Error(
            `Empty relation key '${relationKey}' (in ${instance.key || "[empty key]"})`,
          );
        }
        this[propName] = useDataBucket().getObject<T>(key);
      }
      return this[propName];
    },
    enumerable: true,
    configurable: true,
  });
}

export function canHaveOne<T extends GameObject>(instance: any, relationKey: RelationKey) {
  const { getterName, propName } = setPrivateProp(instance, relationKey);

  Object.defineProperty(instance, getterName, {
    get() {
      if (this[propName] === undefined) {
        const key = this[relationKey] as GameKey | null;
        this[propName] = key ? useDataBucket().getObject<T>(key) : null;
      }
      return this[propName];
    },
    enumerable: true,
    configurable: true,
  });
}

export type RelationKey = `${string}Key` | `${string}Keys`;
function getGetterName(relationKey: RelationKey): string {
  const name = relationKey.replace("Key", "");
  if (name.endsWith("ys")) {
    return name.slice(0, -2) + "ies";
  }
  return name;
}
function setPrivateProp(instance: any, relationKey: RelationKey) {
  const getterName = getGetterName(relationKey);
  const propName = `_${getterName}`;
  if (propName in instance) {
    instance[propName] = undefined;
  } else {
    Object.defineProperty(instance, propName, {
      value: undefined,
      enumerable: false,
      configurable: true,
    });
  }
  return { getterName, propName };
}

// On first call: initializes private cache property & update watchers;
// On all calls: calls getter if not cached; returns cached value
export function computedProp<ObjectT extends ObjectWithProps, ValueT>(
  object: ObjectT,
  privatePropName: string,
  getter: () => ValueT,
  watchProps?: (keyof ObjectT)[],
): ValueT {
  // Not in instance yet -> this is the first call
  if (!(privatePropName in object)) {
    // Initialize the private cache property
    Object.defineProperty(object, privatePropName, {
      enumerable: false,
      configurable: true,
    });

    // Initialize object property watchers (if given)
    if (watchProps?.length) {
      // Tell the object "when you update, let me know what changed"
      object.updateWatchers.push((changes) => {
        // If any of the props we are watching change, invalidate the cache
        if (watchProps.some((prop) => prop in changes)) {
          (object as any)[privatePropName] = undefined;
        }
      });
    }
  }

  // If the value is still undefined, we need to cache by running the getter function
  if ((object as any)[privatePropName] === undefined) {
    (object as any)[privatePropName] = getter();
  }
  return (object as any)[privatePropName] as ValueT;
}
