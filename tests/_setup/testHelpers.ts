import { expect } from "vitest";
import { crawl } from "../../src/helpers/arrayTools";
import { GameObject } from "../../src/objects/game/_GameObject";

export const mockRandom = (...values: number[]) => {
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => {
    if (index >= values.length) {
      throw new Error(
        `mockRandom: ran out of values at index ${index}. Values provided: ${values}`,
      );
    }
    return values[index++];
  };
  return () => {
    Math.random = originalRandom;
  };
};

export const expectFloatsToBeClose = (expected: any, toBe: any, tolerance = 0.001) => {
  const roundingMultiplier = Math.round(1 / tolerance);
  return expect(crawlForFloat(expected)).toEqual(crawlForFloat(toBe));

  function crawlForFloat(crawlIn: any): any {
    return crawl(crawlIn, (v: any) => {
      if (typeof v !== "number") return v;
      const rounded = Math.round(v * roundingMultiplier) / roundingMultiplier;
      // Fix "0 !== -0" invalid mismatch
      if (rounded === 0) return Math.abs(rounded);
      return rounded;
    });
  }
};

/**
 * Relation test helper
 */
export function testOneToOneRelation<T extends GameObject, R extends GameObject>(
  instance: T,
  relationName: keyof T,
  relatedInstance: R,
  relatedInstanceRelationName: keyof R,
) {
  expect(instance[relationName]).toBe(relatedInstance);
  expect(relatedInstance[relatedInstanceRelationName]).toBe(instance);
}

export function testManyToOneRelation<T extends GameObject, R extends GameObject>(
  instance: T,
  relationName: keyof T,
  relatedInstance: R,
  relatedInstanceRelationName: keyof R,
) {
  expect(instance[relationName]).toBe(relatedInstance);
  expect(relatedInstance[relatedInstanceRelationName]).toContain(instance);
}

export function testOneToManyRelation<T extends GameObject, R extends GameObject>(
  instance: T,
  relationName: keyof T,
  relatedInstance: R,
  relatedInstanceRelationKey: keyof R,
) {
  expect(instance[relationName]).toContain(relatedInstance);
  expect(relatedInstance[relatedInstanceRelationKey]).toBe(instance);
}

export function testManyToManyRelation<T extends GameObject, R extends GameObject>(
  instance: T,
  relationName: keyof T,
  relatedInstance: R,
  relatedInstanceRelationName: keyof R,
) {
  expect(instance[relationName]).toContain(relatedInstance);
  expect(relatedInstance[relatedInstanceRelationName]).toContain(instance);
}

/**
 * Common relation error expectations
 */
export function expectRelationToThrowEmpty(instance: any, relationName: string, keyAttr: string) {
  expect(() => instance[relationName]).toThrow(
    `Empty relation key '${keyAttr}' (in ${instance.key})`,
  );
}

export function expectRelationToThrowMissing(instance: any, relationName: string, key: string) {
  expect(() => instance[relationName]).toThrow(`DataBucket.getObject(${key}) does not exist!`);
}

export function expectTypeToThrowMissing(instance: any, attrName: string, key: string) {
  expect(() => instance[attrName]).toThrow(`DataBucket.getType(${key}) does not exist!`);
}
