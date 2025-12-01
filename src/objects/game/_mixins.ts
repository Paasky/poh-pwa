/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import { computed, Ref } from "vue";
import { useObjectsStore } from "@/stores/objectStore";
import { GameKey } from "@/objects/game/_GameObject";

export function hasMany<T>(keysRef: Ref<GameKey[]>, ctor: new (...args: any[]) => T) {
  const out: T[] = [];

  return computed<T[]>(() => {
    const keys = keysRef.value;

    // Resize output to match
    if (out.length !== keys.length) out.length = keys.length;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      // Always read – creates a dependency on the store entry for this key
      try {
        const obj = useObjectsStore().get(key) as T;
        if (out[i] !== obj) out[i] = obj;
      } catch (e) {
        throw new Error(`${ctor.name} HasMany: ${e}`);
      }
    }

    return out;
  });
}

export function hasOne<T>(keyRef: Ref<GameKey | null>, ctor: new (...args: any[]) => T) {
  return computed<T>(() => {
    const key = keyRef.value;
    if (!key) {
      throw new Error(`${ctor.name} HasOne: Empty relation value for ${ctor.name}`);
    }

    return useObjectsStore().get(key) as T;
  });
}

export function canHaveOne<T>(keyRef: Ref<GameKey | null>, ctor: new (...args: any[]) => T) {
  return computed<T | null>(() => {
    const key = keyRef.value;
    if (!key) {
      return null;
    }

    return useObjectsStore().get(key) as T;
  });
}
