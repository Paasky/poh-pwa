import { describe, expect, it } from "vitest";
import {
  crawl,
  getManyRandom,
  getRandom,
  range,
  REMOVE_NODE,
  shuffle,
  SKIP_DESCEND,
  takeManyRandom,
  takeRandom,
} from "@/Common/Helpers/arrayTools";
import { rng } from "@/Common/Helpers/Rng";

describe("arrayTools", () => {
  describe("crawl", () => {
    it("crawl undefined", () => {
      expect(crawl(undefined, (v: any) => v)).toEqual(undefined);
      expect(crawl(undefined, (v: any) => "gg " + v)).toEqual("gg undefined");
    });

    it("crawl null", () => {
      expect(crawl(null as any, (v: any) => v)).toEqual(null);
      expect(crawl(null as any, (v: any) => ({ got: String(v) }))).toEqual({ got: "null" });
    });

    it("crawl string", () => {
      // Identity
      expect(crawl("hey", (v: any) => v)).toEqual("hey");
      // Transform
      expect(crawl("hey", (v: any) => (typeof v === "string" ? v.toUpperCase() : v))).toEqual(
        "HEY",
      );
    });

    it("crawl number", () => {
      // Identity
      expect(crawl(41 as any, (v: any) => v)).toEqual(41);
      // Transform
      expect(crawl(41 as any, (v: any) => (typeof v === "number" ? v + 1 : v))).toEqual(42);
    });

    it("crawl mixed array->primitives/array->primitives/object->primitives", () => {
      const input = [1, "a", true, [2, "b", false], { x: 3, y: "c", z: true }];

      const out = crawl(input, (v: any) => {
        if (typeof v === "number") return v * 10;
        if (typeof v === "string") return v + v; // duplicate
        if (typeof v === "boolean") return !v;
        return v;
      });

      expect(out).toEqual([10, "aa", false, [20, "bb", true], { x: 30, y: "cc", z: false }]);
    });

    it("crawl mixed object->primitives/array->primitives/object->primitives", () => {
      const input = {
        n: 2,
        s: "ok",
        b: false,
        arr: [1, "x", true, { m: 7 }],
        obj: { a: 3, s: "y", b: true },
      };

      const out = crawl(input, (v: any) => {
        if (typeof v === "number") return v + 0.5;
        if (typeof v === "string") return v.toUpperCase();
        if (typeof v === "boolean") return !v;
        return v;
      });

      expect(out).toEqual({
        n: 2.5,
        s: "OK",
        b: true,
        arr: [1.5, "X", false, { m: 7.5 }],
        obj: { a: 3.5, s: "Y", b: false },
      });
    });

    it("crawl skips and removes primitives/arrays/objects", () => {
      const input = {
        a: [1, 2, 3],
        b: { c: 2, d: "x", e: [4, 5] },
        keepArrayAsIs: [10, 20],
        n: 5,
      } as const;

      // whatToDo controls traversal and removal; process transforms the nodes we keep/visit
      const whatToDo = (v: any) => {
        // Remove any number that equals 2 (both in objects and arrays)
        if (typeof v === "number" && v === 2) return REMOVE_NODE;
        // Do not descend into arrays (they will be returned as-is after process step on the array node)
        if (Array.isArray(v)) return SKIP_DESCEND;
        return true as const;
      };

      const process = (v: any) => {
        if (typeof v === "number") return v + 1;
        if (typeof v === "string") return v.toUpperCase();
        return v;
      };

      const out = crawl(input as any, process, whatToDo);

      // Expectations:
      // - Arrays were not descended, so their inner elements are untouched, except that numbers === 2 are not removed
      //   because we skipped descent before reaching them. The arrays are returned intact.
      // - Numbers (non-array positions) were incremented by 1
      // - Strings were uppercased
      // - Object property with value 2 was removed
      expect(out).toEqual({
        a: [1, 2, 3], // unchanged because we skipped descending into arrays
        b: { d: "X", e: [4, 5] }, // c:2 removed; e array unchanged due to skip
        keepArrayAsIs: [10, 20], // unchanged array due to skip
        n: 6, // transformed by process
      });
    });
  });

  describe("random tools", () => {
    it("getRandom picks based on rng.mock", () => {
      const arr = ["a", "b", "c"];
      const cleanup = rng.mock([0.1, 0.5, 0.9]);

      // 0.1 * 3 = 0.3 -> index 0 -> "a"
      expect(getRandom(arr)).toBe("a");
      // 0.5 * 3 = 1.5 -> index 1 -> "b"
      expect(getRandom(arr)).toBe("b");
      // 0.9 * 3 = 2.7 -> index 2 -> "c"
      expect(getRandom(arr)).toBe("c");

      cleanup();
    });

    it("getRandom throws on empty array", () => {
      expect(() => getRandom([])).toThrow("Not enough items in array: 0");
    });

    it("getManyRandom picks multiple items", () => {
      const arr = ["a", "b", "c", "d"];
      const cleanup = rng.mock([0.1, 0.5]);

      expect(getManyRandom(arr, 2)).toEqual(["a", "c"]);

      cleanup();
    });

    it("takeRandom removes item from array", () => {
      const arr = ["a", "b", "c"];
      const cleanup = rng.mock([0.5]); // 0.5 * 3 = 1.5 -> index 1 -> "b"
      expect(takeRandom(arr)).toBe("b");
      expect(arr).toEqual(["a", "c"]);
      cleanup();
    });

    it("takeRandom throws on empty array", () => {
      expect(() => takeRandom([])).toThrow("Not enough items in array: 0");
    });

    it("takeManyRandom picks and removes items", () => {
      const arr = ["a", "b", "c", "d"];
      const cleanup = rng.mock([0.1, 0.5]);
      expect(takeManyRandom(arr, 2)).toEqual(["a", "c"]);
      expect(arr).toEqual(["b", "d"]);
      cleanup();
    });

    it("shuffle shuffles array", () => {
      const arr = [1, 2, 3, 4];
      const cleanup = rng.mock([0.9, 0.1, 0.5]);
      // j = floor(0.9 * 4) = 3. Swap arr[3] with arr[3]. [1, 2, 3, 4]
      // j = floor(0.1 * 3) = 0. Swap arr[2] with arr[0]. [3, 2, 1, 4]
      // j = floor(0.5 * 2) = 1. Swap arr[1] with arr[1]. [3, 2, 1, 4]

      expect(shuffle([...arr])).toEqual([3, 2, 1, 4]);
      cleanup();
    });
  });

  describe("utility tools", () => {
    it("range creates array of numbers", () => {
      expect(range(1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(range(-2, 2)).toEqual([-2, -1, 0, 1, 2]);
      expect(range(5, 5)).toEqual([5]);
    });
  });
});
