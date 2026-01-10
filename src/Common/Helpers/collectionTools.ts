/* eslint-disable @typescript-eslint/no-explicit-any */
/* Allow any for the implementations of the overloads */

import { rng } from "@/Common/Helpers/Rng";

// Global "Collection" Helpers that work with Array/Map/Set (eg Iterable)

export function filter<T>(collection: T[], predicate: (item: T) => boolean): T[];
export function filter<T>(collection: Set<T>, predicate: (item: T) => boolean): Set<T>;
export function filter<K, V>(collection: Map<K, V>, predicate: (item: V) => boolean): Map<K, V>;

// Allow for any of above inputs
export function filter(collection: any, predicate: (item: any) => boolean): any {
  if (Array.isArray(collection)) {
    return collection.filter(predicate);
  }
  if (collection instanceof Set) {
    const result = new Set();
    for (const item of collection) {
      if (predicate(item)) result.add(item);
    }
    return result;
  }
  if (collection instanceof Map) {
    const result = new Map();
    for (const [key, value] of collection.entries()) {
      if (predicate(value)) result.set(key, value);
    }
    return result;
  }
  throw new Error(`unknown collection type ${typeof collection}`);
}

export function filterByKey<K, V>(
  collection: Map<K, V>,
  predicate: (item: [K, V]) => boolean,
): Map<K, V> {
  const result = new Map();
  for (const entry of collection.entries()) {
    if (predicate(entry)) result.set(entry[0], entry[1]);
  }
  return result;
}

export function map<T, U>(collection: T[], mapper: (item: T) => U): U[];
export function map<T, U>(collection: Set<T>, mapper: (item: T) => U): Set<U>;
export function map<K, V, U>(collection: Map<K, V>, mapper: (item: V) => U): Map<K, U>;
export function map(collection: any, mapper: (item: any) => any): any {
  if (Array.isArray(collection)) {
    return collection.map(mapper);
  }
  if (collection instanceof Set) {
    const result = new Set();
    for (const item of collection) {
      result.add(mapper(item));
    }
    return result;
  }
  if (collection instanceof Map) {
    const result = new Map();
    for (const [key, value] of collection.entries()) {
      result.set(key, mapper(value));
    }
    return result;
  }
  throw new Error(`unknown collection type ${typeof collection}`);
}

export function mapByKey<K, V, U>(collection: Map<K, V>, mapper: (item: [K, V]) => U): Map<K, U> {
  const result = new Map();
  for (const entry of collection.entries()) {
    result.set(entry[0], mapper(entry));
  }
  return result;
}

export function groupBy<T, G>(collection: T[], grouper: (item: T) => G): Map<G, T[]>;
export function groupBy<T, G>(collection: Set<T>, grouper: (item: T) => G): Map<G, Set<T>>;
export function groupBy<K, V, G>(collection: Map<K, V>, grouper: (item: V) => G): Map<G, Map<K, V>>;
export function groupBy(collection: any, grouper: (item: any) => any): any {
  const result = new Map();
  if (Array.isArray(collection)) {
    for (const item of collection) {
      const group = grouper(item);
      if (!result.has(group)) result.set(group, []);
      result.get(group).push(item);
    }
  } else if (collection instanceof Set) {
    for (const item of collection) {
      const group = grouper(item);
      if (!result.has(group)) result.set(group, new Set());
      result.get(group).add(item);
    }
  } else if (collection instanceof Map) {
    for (const [key, value] of collection.entries()) {
      const group = grouper(value);
      if (!result.has(group)) result.set(group, new Map());
      result.get(group).set(key, value);
    }
  } else {
    throw new Error(`unknown collection type ${typeof collection}`);
  }
  return result;
}

export function groupByByKey<K, V, G>(
  collection: Map<K, V>,
  grouper: (item: [K, V]) => G,
): Map<G, Map<K, V>> {
  const result = new Map();
  for (const entry of collection.entries()) {
    const group = grouper(entry);
    if (!result.has(group)) result.set(group, new Map());
    result.get(group).set(entry[0], entry[1]);
  }
  return result;
}

export function diff<T>(collectionA: T[], collectionB: Iterable<T>): T[];
export function diff<T>(collectionA: Set<T>, collectionB: Iterable<T>): Set<T>;
export function diff<K, V>(collectionA: Map<K, V>, collectionB: Map<K, V>): Map<K, V>;
export function diff(collectionA: any, collectionB: any): any {
  if (Array.isArray(collectionA)) {
    const bSet = new Set(collectionB);
    return collectionA.filter((item) => !bSet.has(item));
  }
  if (collectionA instanceof Set) {
    const bSet = new Set(collectionB);
    const result = new Set();
    for (const item of collectionA) {
      if (!bSet.has(item)) result.add(item);
    }
    return result;
  }
  if (collectionA instanceof Map) {
    const result = new Map();
    const bValues = new Set(collectionB.values());
    for (const [key, value] of collectionA.entries()) {
      if (!bValues.has(value)) result.set(key, value);
    }
    return result;
  }
  throw new Error(`unknown collection type ${typeof collectionA}`);
}

export function diffDetail<T>(
  collectionA: T[],
  collectionB: T[],
): { onlyA: T[]; both: T[]; onlyB: T[] };
export function diffDetail<T>(
  collectionA: Set<T>,
  collectionB: Set<T>,
): { onlyA: Set<T>; both: Set<T>; onlyB: Set<T> };
export function diffDetail<K, V>(
  collectionA: Map<K, V>,
  collectionB: Map<K, V>,
): { onlyA: Map<K, V>; both: Map<K, V>; onlyB: Map<K, V> };
export function diffDetail(collectionA: any, collectionB: any): any {
  if (Array.isArray(collectionA)) {
    const bSet = new Set(collectionB);
    const onlyA = collectionA.filter((item) => !bSet.has(item));
    const both = collectionA.filter((item) => bSet.has(item));
    const aSet = new Set(collectionA);
    const onlyB = [...collectionB].filter((item) => !aSet.has(item));
    return { onlyA, both, onlyB };
  }
  if (collectionA instanceof Set) {
    const bSet = new Set(collectionB);
    const onlyA = new Set();
    const both = new Set();
    for (const item of collectionA) {
      if (bSet.has(item)) both.add(item);
      else onlyA.add(item);
    }
    const onlyB = new Set();
    for (const item of collectionB) {
      if (!collectionA.has(item)) onlyB.add(item);
    }
    return { onlyA, both, onlyB };
  }
  if (collectionA instanceof Map) {
    const onlyA = new Map();
    const both = new Map();
    const bValues = new Set(collectionB.values());
    for (const [key, value] of collectionA.entries()) {
      if (bValues.has(value)) both.set(key, value);
      else onlyA.set(key, value);
    }
    const onlyB = new Map();
    const aValues = new Set(collectionA.values());
    for (const [key, value] of collectionB.entries()) {
      if (!aValues.has(value)) onlyB.set(key, value);
    }
    return { onlyA, both, onlyB };
  }
  throw new Error(`unknown collection type ${typeof collectionA}`);
}

export function intersect<T>(collectionA: T[], collectionB: Iterable<T>): T[];
export function intersect<T>(collectionA: Set<T>, collectionB: Iterable<T>): Set<T>;
export function intersect<K, V>(collectionA: Map<K, V>, collectionB: Map<K, V>): Map<K, V>;
export function intersect(collectionA: any, collectionB: any): any {
  if (Array.isArray(collectionA)) {
    const bSet = new Set(collectionB);
    return collectionA.filter((item) => bSet.has(item));
  }
  if (collectionA instanceof Set) {
    const bSet = new Set(collectionB);
    const result = new Set();
    for (const item of collectionA) {
      if (bSet.has(item)) result.add(item);
    }
    return result;
  }
  if (collectionA instanceof Map) {
    const result = new Map();
    for (const [key, value] of collectionA.entries()) {
      if (collectionB.has(key)) result.set(key, value);
    }
    return result;
  }
  throw new Error(`unknown collection type ${typeof collectionA}`);
}

export function union<T>(collectionA: T[], collectionB: Iterable<T>): T[];
export function union<T>(collectionA: Set<T>, collectionB: Iterable<T>): Set<T>;
export function union<K, V>(collectionA: Map<K, V>, collectionB: Map<K, V>): Map<K, V>;
export function union(collectionA: any, collectionB: any): any {
  if (Array.isArray(collectionA)) {
    const result = [...collectionA];
    const aSet = new Set(collectionA);
    for (const item of collectionB) {
      if (!aSet.has(item)) result.push(item);
    }
    return result;
  }
  if (collectionA instanceof Set) {
    const result = new Set(collectionA);
    for (const item of collectionB) {
      result.add(item);
    }
    return result;
  }
  if (collectionA instanceof Map) {
    const result = new Map(collectionA);
    for (const [key, value] of collectionB.entries()) {
      result.set(key, value);
    }
    return result;
  }
  throw new Error(`unknown collection type ${typeof collectionA}`);
}
export function diffByKey<K, V>(collectionA: Map<K, V>, collectionB: Map<K, V>): Map<K, V> {
  const result = new Map();
  for (const [key, value] of collectionA.entries()) {
    if (!collectionB.has(key)) result.set(key, value);
  }
  return result;
}

export function diffDetailByKey<K, V>(
  collectionA: Map<K, V>,
  collectionB: Map<K, V>,
): { onlyA: Map<K, V>; both: Map<K, V>; onlyB: Map<K, V> } {
  const onlyA = new Map();
  const both = new Map();
  for (const [key, value] of collectionA.entries()) {
    if (collectionB.has(key)) both.set(key, value);
    else onlyA.set(key, value);
  }
  const onlyB = new Map();
  for (const [key, value] of collectionB.entries()) {
    if (!collectionA.has(key)) onlyB.set(key, value);
  }
  return { onlyA, both, onlyB };
}

export function has<T>(
  collection: T[] | Set<T> | Map<any, T>,
  itemOrPredicate: T | ((item: T) => boolean),
): boolean {
  const isPredicate = typeof itemOrPredicate === "function";

  if (Array.isArray(collection)) {
    if (isPredicate) return collection.some(itemOrPredicate as (item: T) => boolean);
    return collection.includes(itemOrPredicate as T);
  }
  if (collection instanceof Set) {
    if (isPredicate) {
      for (const i of collection) {
        if ((itemOrPredicate as (item: T) => boolean)(i)) return true;
      }
      return false;
    }
    return collection.has(itemOrPredicate as T);
  }
  if (collection instanceof Map) {
    if (isPredicate) {
      for (const value of collection.values()) {
        if ((itemOrPredicate as (item: T) => boolean)(value)) return true;
      }
      return false;
    }
    for (const value of collection.values()) {
      if (value === itemOrPredicate) return true;
    }
    return false;
  }
  throw new Error(`unknown collection type ${typeof collection}`);
}

export function sort<CollectionT extends Iterable<ItemT>, ItemT>(
  collection: CollectionT,
  comparator?: (a: ItemT, b: ItemT) => number,
): ItemT[] {
  if (Array.isArray(collection) || collection instanceof Set || collection instanceof Map) {
    return [...collection].sort(comparator);
  }
  throw new Error(`unknown collection type ${typeof collection}`);
}

export function length(collection: any[] | Set<any> | Map<any, any>): number {
  if (Array.isArray(collection)) {
    return collection.length;
  }
  if (collection instanceof Set || collection instanceof Map) {
    return collection.size;
  }
  throw new Error(`unknown collection type ${typeof collection}`);
}

export function reduce<T, U>(
  collection: T[],
  reducer: (accumulator: U, item: T) => U,
  initialValue: U,
): U;
export function reduce<T, U>(
  collection: Set<T>,
  reducer: (accumulator: U, item: T) => U,
  initialValue: U,
): U;
export function reduce<K, V, U>(
  collection: Map<K, V>,
  reducer: (accumulator: U, item: V) => U,
  initialValue: U,
): U;
export function reduce(
  collection: any,
  reducer: (acc: any, item: any) => any,
  initialValue: any,
): any {
  if (Array.isArray(collection)) {
    return collection.reduce(reducer, initialValue);
  }
  if (collection instanceof Set) {
    let acc = initialValue;
    for (const item of collection) {
      acc = reducer(acc, item);
    }
    return acc;
  }
  if (collection instanceof Map) {
    let acc = initialValue;
    for (const value of collection.values()) {
      acc = reducer(acc, value);
    }
    return acc;
  }
  throw new Error(`unknown collection type ${typeof collection}`);
}

export function reduceByKey<K, V, U>(
  collection: Map<K, V>,
  reducer: (accumulator: U, item: [K, V]) => U,
  initialValue: U,
): U {
  let acc = initialValue;
  for (const entry of collection.entries()) {
    acc = reducer(acc, entry);
  }
  return acc;
}

export function getRandomItem<T>(collection: T[]): T | undefined;
export function getRandomItem<T>(collection: Set<T>): T | undefined;
export function getRandomItem<K, V>(collection: Map<K, V>): V | undefined;
export function getRandomItem<T>(collection: Iterable<T>): T | undefined;
export function getRandomItem(collection: any): any {
  return rng.pick(collection);
}

export function takeRandomItem<T>(collection: T[]): T | undefined;
export function takeRandomItem<T>(collection: Set<T>): T | undefined;
export function takeRandomItem<K, V>(collection: Map<K, V>): V | undefined;
export function takeRandomItem(collection: any): any {
  return rng.take(collection);
}
