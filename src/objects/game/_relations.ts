/* eslint-disable @typescript-eslint/no-explicit-any */
// noinspection JSUnusedLocalSymbols

import { GameKey, GameObject } from "@/objects/game/_GameObject";
import { useDataBucket } from "@/Data/useDataBucket";

export function hasMany<T extends GameObject>(instance: any, relationKey: string) {
  const getterName = relationKey.replace("Keys", "s").replace("ys", "ies");
  const privateProp = `_${getterName}`;

  // Initialize the private cache property
  instance[privateProp] = undefined;

  Object.defineProperty(instance, getterName, {
    get() {
      if (this[privateProp] === undefined) {
        const keys = this[relationKey] as Set<GameKey>;
        this[privateProp] = Array.from(keys).map((key) => useDataBucket().getObject<T>(key));
      }
      return this[privateProp];
    },
    enumerable: true,
    configurable: true,
  });
}

export function hasOne<T extends GameObject>(instance: any, relationKey: string) {
  const getterName = relationKey.replace("Key", "");
  const privateProp = `_${getterName}`;

  // Initialize the private cache property
  instance[privateProp] = undefined;

  Object.defineProperty(instance, getterName, {
    get() {
      if (this[privateProp] === undefined) {
        const key = this[relationKey] as GameKey;
        if (!key) {
          throw new Error(
            `Empty relation key '${relationKey}' (in ${instance.key || "[empty key]"})`,
          );
        }
        this[privateProp] = useDataBucket().getObject<T>(key);
      }
      return this[privateProp];
    },
    enumerable: true,
    configurable: true,
  });
}

export function canHaveOne<T extends GameObject>(instance: any, relationKey: string) {
  const getterName = relationKey.replace("Key", "");
  const privateProp = `_${getterName}`;

  // Initialize the private cache property
  instance[privateProp] = undefined;

  Object.defineProperty(instance, getterName, {
    get() {
      if (this[privateProp] === undefined) {
        const key = this[relationKey] as GameKey | null;
        this[privateProp] = key ? useDataBucket().getObject<T>(key) : null;
      }
      return this[privateProp];
    },
    enumerable: true,
    configurable: true,
  });
}
