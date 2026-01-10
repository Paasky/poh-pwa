import { describe, expect, it } from "vitest";
import { Rng, rng } from "@/Common/Helpers/Rng";

describe("Rng", () => {
  it("should generate deterministic sequences with the same seed", () => {
    const rng1 = new Rng("seed1");
    const rng2 = new Rng("seed1");

    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.next()).toBe(rng2.next());
  });

  it("should generate different sequences with different seeds", () => {
    const rng1 = new Rng("seed1");
    const rng2 = new Rng("seed2");

    expect(rng1.next()).not.toBe(rng2.next());
  });

  it("should support mocking values", () => {
    const mockRng = new Rng();
    const cleanup = mockRng.mock([0.1, 0.5, 0.9]);

    expect(mockRng.next()).toBe(0.1);
    expect(mockRng.next()).toBe(0.5);
    expect(mockRng.next()).toBe(0.9);

    expect(() => mockRng.next()).toThrow("Rng.mock: exhausted values at index 3.");

    cleanup();
    // Should now return a random number without throwing
    expect(typeof mockRng.next()).toBe("number");
  });

  it("should support getting and setting state", () => {
    const rng1 = new Rng("state-test");
    rng1.next(); // advance state
    const state = rng1.getState();

    const rng2 = new Rng();
    rng2.setState(state);

    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.next()).toBe(rng2.next());
  });

  it("between() should return values within range", () => {
    const myRng = new Rng();
    for (let i = 0; i < 100; i++) {
      const val = myRng.between(10, 20);
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThan(20);
    }
  });

  it("intBetween() should return integers within range", () => {
    const myRng = new Rng();
    const values = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const val = myRng.intBetween(1, 3);
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(3);
      values.add(val);
    }
    // With 100 iterations, we should have seen all values 1, 2, 3
    expect(values.has(1)).toBe(true);
    expect(values.has(2)).toBe(true);
    expect(values.has(3)).toBe(true);
  });

  it("chance() should work as expected", () => {
    const myRng = new Rng();
    myRng.mock([0.1, 0.9]);
    expect(myRng.chance(0.5)).toBe(true);
    expect(myRng.chance(0.5)).toBe(false);
  });

  it("pick() should return items from various collections", () => {
    const myRng = new Rng();
    const arr = [1, 2, 3];
    const set = new Set([4, 5, 6]);
    const map = new Map([
      ["a", 7],
      ["b", 8],
      ["c", 9],
    ]);

    expect(arr).toContain(myRng.pick(arr));
    expect(set).toContain(myRng.pick(set));
    expect(Array.from(map.values())).toContain(myRng.pick(map));

    expect(myRng.pick([])).toBeUndefined();
  });

  it("pickMany() should return N unique items", () => {
    const myRng = new Rng();
    const arr = [1, 2, 3, 4, 5];
    const picked = myRng.pickMany(arr, 3);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
    picked.forEach((p) => expect(arr).toContain(p));
  });

  it("take() should remove items from collections", () => {
    const myRng = new Rng();

    const arr = [1, 2, 3];
    const pickedArr = myRng.take(arr);
    expect(arr).toHaveLength(2);
    expect(arr).not.toContain(pickedArr);

    const set = new Set([4, 5, 6]);
    const pickedSet = myRng.take(set);
    expect(set.size).toBe(2);
    expect(set.has(pickedSet as number)).toBe(false);

    const map = new Map([
      ["a", 7],
      ["b", 8],
    ]);
    const pickedMap = myRng.take(map);
    expect(map.size).toBe(1);
    expect(Array.from(map.values())).not.toContain(pickedMap);
  });

  it("shuffle() should shuffle in-place", () => {
    const myRng = new Rng("shuffle-test");
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const original = [...arr];
    myRng.shuffle(arr);
    expect(arr).toHaveLength(original.length);
    expect(new Set(arr).size).toBe(original.length);
    expect(arr).not.toEqual(original);
  });

  it("jitter() should return values within jitter range", () => {
    const myRng = new Rng();
    for (let i = 0; i < 100; i++) {
      const val = myRng.jitter(100, 10);
      expect(val).toBeGreaterThanOrEqual(90);
      expect(val).toBeLessThanOrEqual(110);
    }
  });

  it("global rng singleton should be available", () => {
    expect(rng).toBeInstanceOf(Rng);
  });
});
