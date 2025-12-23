import { expect } from "vitest";
import { crawl } from "../../src/helpers/arrayTools";

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
