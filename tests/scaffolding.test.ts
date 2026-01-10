import { describe, expect, it } from "vitest";
import { rng } from "@/Common/Helpers/Rng";

// The purpose of this test is to sanity-check all test scaffolding required by this project.

describe("Scaffolding", () => {
  it("Verify rng() mock & determinism", () => {
    rng.seed("scaffolding");
    const val1 = rng.next();
    const val2 = rng.next();

    rng.seed("scaffolding");
    expect(rng.next()).toBe(val1);
    expect(rng.next()).toBe(val2);

    const cleanup = rng.mock([0.123]);
    expect(rng.next()).toBe(0.123);
    cleanup();
    expect(rng.next()).not.toBe(0.123);
  });
});

// Verify Data Bucket

// Verify Test World

// Verify DOM mock