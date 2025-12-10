import { expect } from "vitest";
import { crawl } from "../../src/helpers/arrayTools";

export const expectFloatsToBeClose = (expected: object, toBe: object) => {
  return expect(crawlForFloat(expected)).toEqual(crawlForFloat(toBe));

  function crawlForFloat(crawlIn: any): any {
    return crawl(crawlIn, (v: any) => {
      if (typeof v !== "number") return v;
      const rounded = Math.round(v * 1000) / 1000;
      // Fix "0 !== -0" invalid mismatch
      if (rounded === 0) return Math.abs(rounded);
      return rounded;
    });
  }
};
