import { describe, expect, it } from "vitest";
import {
  diff,
  diffByKey,
  diffDetail,
  diffDetailByKey,
  filter,
  filterByKey,
  getRandomItem,
  groupBy,
  groupByByKey,
  has,
  intersect,
  length,
  map,
  mapByKey,
  reduce,
  reduceByKey,
  sort,
  takeRandomItem,
  union,
} from "@/Common/Helpers/collectionTools";
import { rng } from "@/Common/Helpers/Rng";

describe("collectionTools", () => {
  describe("filter", () => {
    it("filters an Array", () => {
      const input = [1, 2, 3, 4, 5];
      const result = filter(input, (x) => x % 2 === 0);
      expect(result).toEqual([2, 4]);
    });

    it("filters a Set", () => {
      const input = new Set([1, 2, 3, 4, 5]);
      const result = filter(input, (x) => x % 2 === 0);
      expect(result).toBeInstanceOf(Set);
      expect(Array.from(result)).toEqual([2, 4]);
    });

    it("filters a Map (by value)", () => {
      const input = new Map([
        ["a", 1],
        ["b", 2],
        ["c", 3],
      ]);
      const result = filter(input, (value) => value > 1);
      expect(result).toBeInstanceOf(Map);
      expect(Array.from(result.entries())).toEqual([
        ["b", 2],
        ["c", 3],
      ]);
    });

    it("filters a Map (by key/value using filterByKey)", () => {
      const input = new Map([
        ["a", 1],
        ["b", 2],
        ["c", 3],
      ]);
      const result = filterByKey(input, ([key, value]) => key === "b" || value === 3);
      expect(result).toBeInstanceOf(Map);
      expect(Array.from(result.entries())).toEqual([
        ["b", 2],
        ["c", 3],
      ]);
    });

    it("throws error for unknown collection type", () => {
      expect(() => filter({} as any, () => true)).toThrow("unknown collection type object");
    });
  });

  describe("map", () => {
    it("maps an Array", () => {
      const input = [1, 2, 3];
      const result = map(input, (x) => x * 2);
      expect(result).toEqual([2, 4, 6]);
    });

    it("maps a Set", () => {
      const input = new Set([1, 2, 3]);
      const result = map(input, (x) => x * 2);
      expect(result).toBeInstanceOf(Set);
      expect(Array.from(result)).toEqual([2, 4, 6]);
    });

    it("maps a Map (by value)", () => {
      const input = new Map([
        ["a", 1],
        ["b", 2],
      ]);
      const result = map(input, (value) => value * 2);
      expect(result).toBeInstanceOf(Map);
      expect(result.get("a")).toBe(2);
      expect(result.get("b")).toBe(4);
    });

    it("maps a Map (by key/value using mapByKey)", () => {
      const input = new Map([
        ["a", 1],
        ["b", 2],
      ]);
      const result = mapByKey(input, ([key, value]) => `${key}:${value * 2}`);
      expect(result).toBeInstanceOf(Map);
      expect(result.get("a")).toBe("a:2");
      expect(result.get("b")).toBe("b:4");
    });

    it("throws error for unknown collection type", () => {
      expect(() => map({} as any, (x) => x)).toThrow("unknown collection type object");
    });
  });

  describe("groupBy", () => {
    it("groups an Array", () => {
      const input = [1, 2, 3, 4, 5, 6];
      const result = groupBy(input, (x) => (x % 2 === 0 ? "even" : "odd"));
      expect(result).toBeInstanceOf(Map);
      expect(result.get("even")).toEqual([2, 4, 6]);
      expect(result.get("odd")).toEqual([1, 3, 5]);
    });

    it("groups a Set", () => {
      const input = new Set([1, 2, 3, 4, 5, 6]);
      const result = groupBy(input, (x) => (x % 2 === 0 ? "even" : "odd"));
      expect(result.get("even")).toBeInstanceOf(Set);
      expect(Array.from(result.get("even"))).toEqual([2, 4, 6]);
    });

    it("groups a Map (by value)", () => {
      const input = new Map([
        ["a1", { type: "a" }],
        ["a2", { type: "a" }],
        ["b1", { type: "b" }],
      ]);
      const result = groupBy(input, (value) => value.type);
      expect(result.get("a")).toBeInstanceOf(Map);
      expect(result.get("a").get("a1")).toEqual({ type: "a" });
      expect(result.get("a").get("a2")).toEqual({ type: "a" });
      expect(result.get("b").get("b1")).toEqual({ type: "b" });
    });

    it("groups a Map (by key/value using groupByByKey)", () => {
      const input = new Map([
        ["a1", { type: "a" }],
        ["a2", { type: "a" }],
        ["b1", { type: "b" }],
      ]);
      const result = groupByByKey(input, ([key, value]) => (key.startsWith("a") ? "A" : "B"));
      expect(result.get("A")).toBeInstanceOf(Map);
      expect(result.get("A").size).toBe(2);
      expect(result.get("B").size).toBe(1);
    });

    it("throws error for unknown collection type", () => {
      expect(() => groupBy({} as any, (x) => x)).toThrow("unknown collection type object");
    });
  });

  describe("diff", () => {
    it("diffs an Array", () => {
      const a = [1, 2, 3];
      const b = [2, 3, 4];
      const result = diff(a, b);
      expect(result).toEqual([1]);
    });

    it("diffs a Set", () => {
      const a = new Set([1, 2, 3]);
      const b = new Set([2, 3, 4]);
      const result = diff(a, b);
      expect(result).toBeInstanceOf(Set);
      expect(Array.from(result)).toEqual([1]);
    });

    it("diffs a Map (by values according to implementation)", () => {
      const a = new Map([
        ["k1", "v1"],
        ["k2", "v2"],
      ]);
      const b = new Map([["k3", "v2"]]);
      const result = diff(a, b);
      expect(result).toBeInstanceOf(Map);
      expect(result.has("k1")).toBe(true);
      expect(result.has("k2")).toBe(false); // v2 is in b
    });

    it("throws error for unknown collection type", () => {
      expect(() => diff({} as any, [])).toThrow("unknown collection type object");
    });
  });

  describe("diffDetail", () => {
    it("diffDetail an Array", () => {
      const a = [1, 2, 3];
      const b = [2, 3, 4];
      const { onlyA, both, onlyB } = diffDetail(a, b);
      expect(onlyA).toEqual([1]);
      expect(both).toEqual([2, 3]);
      expect(onlyB).toEqual([4]);
    });

    it("diffDetail a Set", () => {
      const a = new Set([1, 2, 3]);
      const b = new Set([2, 3, 4]);
      const { onlyA, both, onlyB } = diffDetail(a, b);
      expect(Array.from(onlyA)).toEqual([1]);
      expect(Array.from(both)).toEqual([2, 3]);
      expect(Array.from(onlyB)).toEqual([4]);
    });

    it("diffDetail a Map", () => {
      const a = new Map([
        ["k1", "v1"],
        ["k2", "v2"],
      ]);
      const b = new Map([
        ["k3", "v2"],
        ["k4", "v4"],
      ]);
      const { onlyA, both, onlyB } = diffDetail(a, b);
      expect(Array.from(onlyA.values())).toEqual(["v1"]);
      expect(Array.from(both.values())).toEqual(["v2"]);
      expect(Array.from(onlyB.values())).toEqual(["v4"]);
    });
  });

  describe("intersect", () => {
    it("intersects an Array", () => {
      const a = [1, 2, 3];
      const b = [2, 3, 4];
      expect(intersect(a, b)).toEqual([2, 3]);
    });

    it("intersects a Set", () => {
      const a = new Set([1, 2, 3]);
      const b = new Set([2, 3, 4]);
      const result = intersect(a, b);
      expect(Array.from(result)).toEqual([2, 3]);
    });

    it("intersects a Map (by keys according to implementation)", () => {
      const a = new Map([
        ["k1", "v1"],
        ["k2", "v2"],
      ]);
      const b = new Map([["k2", "other"]]);
      const result = intersect(a, b);
      expect(result.size).toBe(1);
      expect(result.get("k2")).toBe("v2");
    });
  });

  describe("union", () => {
    it("unions an Array", () => {
      const a = [1, 2, 3];
      const b = [3, 4, 5];
      expect(union(a, b)).toEqual([1, 2, 3, 4, 5]);
    });

    it("unions a Set", () => {
      const a = new Set([1, 2]);
      const b = new Set([2, 3]);
      const result = union(a, b);
      expect(Array.from(result)).toEqual([1, 2, 3]);
    });

    it("unions a Map", () => {
      const a = new Map([["k1", "v1"]]);
      const b = new Map([["k2", "v2"]]);
      const result = union(a, b);
      expect(result.size).toBe(2);
      expect(result.get("k1")).toBe("v1");
      expect(result.get("k2")).toBe("v2");
    });
  });

  describe("diffByKey and diffDetailByKey", () => {
    it("diffByKey", () => {
      const a = new Map([
        ["k1", "v1"],
        ["k2", "v2"],
      ]);
      const b = new Map([["k2", "v2-updated"]]);
      const result = diffByKey(a, b);
      expect(result.size).toBe(1);
      expect(result.has("k1")).toBe(true);
    });

    it("diffDetailByKey", () => {
      const a = new Map([
        ["k1", "v1"],
        ["k2", "v2"],
      ]);
      const b = new Map([
        ["k2", "v2-updated"],
        ["k3", "v3"],
      ]);
      const { onlyA, both, onlyB } = diffDetailByKey(a, b);
      expect(Array.from(onlyA.keys())).toEqual(["k1"]);
      expect(Array.from(both.keys())).toEqual(["k2"]);
      expect(Array.from(onlyB.keys())).toEqual(["k3"]);
    });
  });

  describe("has", () => {
    it("checks an Array", () => {
      const input = [1, 2, 3];
      expect(has(input, 2)).toBe(true);
      expect(has(input, 4)).toBe(false);
      expect(has(input, (x) => x > 2)).toBe(true);
    });

    it("checks a Set", () => {
      const input = new Set([1, 2, 3]);
      expect(has(input, 2)).toBe(true);
      expect(has(input, 4)).toBe(false);
      expect(has(input, (x) => x > 2)).toBe(true);
    });

    it("checks a Map (checks values)", () => {
      const input = new Map([["k1", "v1"]]);
      expect(has(input, "v1")).toBe(true);
      expect(has(input, "k1")).toBe(false);
      expect(has(input, (v) => v === "v1")).toBe(true);
    });
  });

  describe("sort", () => {
    it("sorts Array, Set, Map into Array", () => {
      expect(sort([3, 1, 2])).toEqual([1, 2, 3]);
      expect(sort(new Set([3, 1, 2]))).toEqual([1, 2, 3]);
      // For Map, it's sorting the [key, value] entries
      const m = new Map([
        [2, "b"],
        [1, "a"],
      ]);
      const sorted = sort(m, (a, b) => a[0] - b[0]);
      expect(sorted).toEqual([
        [1, "a"],
        [2, "b"],
      ]);
    });
  });

  describe("getRandomItem and takeRandomItem", () => {
    it("getRandomItem from Array", () => {
      const input = [1, 2, 3];
      const cleanup = rng.mock([0.4]); // Math.floor(0.4 * 3) = 1
      expect(getRandomItem(input)).toBe(2);
      cleanup();
    });

    it("getRandomItem from Set", () => {
      const input = new Set([10, 20, 30]);
      const cleanup = rng.mock([0.7]); // Math.floor(0.7 * 3) = 2
      expect(getRandomItem(input)).toBe(30);
      cleanup();
    });

    it("getRandomItem from Map (returns value)", () => {
      const input = new Map([
        ["a", 100],
        ["b", 200],
      ]);
      const cleanup = rng.mock([0.1]); // Math.floor(0.1 * 2) = 0
      expect(getRandomItem(input)).toBe(100);
      cleanup();
    });

    it("takeRandomItem from Array", () => {
      const input = [1, 2, 3];
      const cleanup = rng.mock([0.1]);
      expect(takeRandomItem(input)).toBe(1);
      expect(input).toEqual([2, 3]);
      cleanup();
    });

    it("takeRandomItem from Set", () => {
      const input = new Set([1, 2, 3]);
      const cleanup = rng.mock([0.9]); // index 2 -> item 3
      expect(takeRandomItem(input)).toBe(3);
      expect(input.has(3)).toBe(false);
      cleanup();
    });

    it("takeRandomItem from Map", () => {
      const input = new Map([["a", 1]]);
      const cleanup = rng.mock([0.1]);
      expect(takeRandomItem(input)).toBe(1);
      expect(input.size).toBe(0);
      cleanup();
    });

    it("returns undefined for empty collections", () => {
      expect(getRandomItem([])).toBeUndefined();
      expect(getRandomItem(new Set())).toBeUndefined();
      expect(getRandomItem(new Map())).toBeUndefined();
      expect(takeRandomItem([])).toBeUndefined();
      expect(takeRandomItem(new Map())).toBeUndefined();
    });
  });

  describe("intersect edge cases", () => {
    it("throws for unknown type", () => {
      expect(() => intersect({} as any, [])).toThrow("unknown collection type object");
    });
  });

  describe("union edge cases", () => {
    it("throws for unknown type", () => {
      expect(() => union({} as any, [])).toThrow("unknown collection type object");
    });
  });

  describe("sort edge cases", () => {
    it("throws for unknown type", () => {
      expect(() => sort({} as any)).toThrow("unknown collection type object");
    });
  });

  describe("takeRandomItem edge cases", () => {
    it("throws for unknown type", () => {
      expect(() => takeRandomItem({} as any)).toThrow("unknown collection type object");
    });
  });

  describe("has edge cases", () => {
    it("throws for unknown type", () => {
      expect(() => has({} as any, 1)).toThrow("unknown collection type object");
    });
  });

  describe("length", () => {
    it("returns length of an Array", () => {
      expect(length([1, 2, 3])).toBe(3);
      expect(length([])).toBe(0);
    });

    it("returns size of a Set", () => {
      expect(length(new Set([1, 2]))).toBe(2);
      expect(length(new Set())).toBe(0);
    });

    it("returns size of a Map", () => {
      expect(length(new Map([["a", 1]]))).toBe(1);
      expect(length(new Map())).toBe(0);
    });

    it("throws for unknown type", () => {
      expect(() => length({} as any)).toThrow("unknown collection type object");
    });
  });

  describe("reduce", () => {
    it("reduces an Array", () => {
      const input = [1, 2, 3, 4];
      const result = reduce(input, (acc, val) => acc + val, 0);
      expect(result).toBe(10);
    });

    it("reduces a Set", () => {
      const input = new Set([1, 2, 3, 4]);
      const result = reduce(input, (acc, val) => acc + val, 10);
      expect(result).toBe(20);
    });

    it("reduces a Map (by value)", () => {
      const input = new Map([
        ["a", 1],
        ["b", 2],
        ["c", 3],
      ]);
      const result = reduce(input, (acc, val) => acc + val, 0);
      expect(result).toBe(6);
    });

    it("reduces a Map (by key/value using reduceByKey)", () => {
      const input = new Map([
        ["a", 1],
        ["b", 2],
      ]);
      const result = reduceByKey(input, (acc, [key, val]) => acc + key + val, "");
      expect(result).toBe("a1b2");
    });

    it("handles empty collections with initial value", () => {
      expect(reduce([], (acc, val) => acc + val, 5)).toBe(5);
      expect(reduce(new Set(), (acc, val) => acc + val, 5)).toBe(5);
      expect(reduce(new Map(), (acc, val) => acc + val, 5)).toBe(5);
      expect(reduceByKey(new Map(), (acc, [key, val]) => acc + val, 5)).toBe(5);
    });

    it("throws error for unknown collection type", () => {
      expect(() => reduce({} as any, (acc, val) => acc + val, 0)).toThrow(
        "unknown collection type object",
      );
    });
  });
});
