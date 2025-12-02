// noinspection JSUnusedLocalSymbols

import { computed, isRef, Ref } from "vue";
import { useObjectsStore } from "@/stores/objectStore";
import { GameKey } from "@/objects/game/_GameObject";
import { withCallerContext } from "@/utils/stack";

export function hasMany<T>(keysValue: GameKey[] | Ref<GameKey[]>, debug: `${GameKey}.${string}`) {
  const out: T[] = [];

  return computed<T[]>(() => {
    const keys = isRef(keysValue) ? keysValue.value : keysValue;
    // Resize output to match
    if (out.length !== keys.length) out.length = keys.length;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      // Always read – creates a dependency on the store entry for this key
      try {
        const obj = useObjectsStore().get(key) as T;
        if (out[i] !== obj) out[i] = obj;
      } catch (e) {
        throw withCallerContext(`${debug}: ${e}`);
      }
    }

    return out.slice();
  });
}

export function hasOne<T>(keyValue: GameKey | Ref<GameKey>, debug: `${GameKey}.${string}`) {
  return computed(() => {
    const key = isRef(keyValue) ? keyValue.value : keyValue;
    if (!key) {
      throw withCallerContext(`${debug}: Empty relation value`);
    }
    try {
      return useObjectsStore().get(key) as T;
    } catch (e) {
      throw withCallerContext(`${debug}: ${e}`);
    }
  });
}

export function canHaveOne<T>(
  keyValue: GameKey | null | Ref<GameKey | null>,
  debug: `${GameKey}.${string}`,
) {
  return computed(() => {
    const key = isRef(keyValue) ? keyValue.value : keyValue;
    if (!key) {
      return null;
    }
    try {
      return useObjectsStore().get(key) as T;
    } catch (e) {
      throw withCallerContext(`${debug}: ${e}`);
    }
  });
}
