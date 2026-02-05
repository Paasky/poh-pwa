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

const relations = new Map<GameKey, Set<GameKey>>();
const backRelations = new Map<GameKey, Set<GameKey>>();

function addRelation(fromKey: GameKey, toKey: GameKey) {
  const existingFrom = relations.get(fromKey);
  if (existingFrom) {
    existingFrom.add(toKey);
  } else  {
    relations.set(fromKey, new Set([toKey]));
  }

  const existingTo = backRelations.get(toKey);
  if (existingTo) {
    existingTo.add(fromKey);
  } else {
    backRelations.set(toKey, new Set([fromKey]));
  }
}

function removeRelation(fromKey: GameKey, toKey: GameKey) {
  const existingFrom = relations.get(fromKey);
  if (existingFrom) {
    existingFrom.delete(toKey);
  }

  const existingTo = backRelations.get(toKey);
  if (existingTo) {
    backRelations.delete(fromKey);
  }
}