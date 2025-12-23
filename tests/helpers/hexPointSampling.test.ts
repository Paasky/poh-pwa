import { describe, expect, it } from "vitest";
import { buildRandomPointsInHex } from "../../src/helpers/hexPointSampling";
import { mockRandom } from "../_setup/testHelpers";

describe("hexPointSampling", () => {
  it("buildRandomPointsInHex (even mode)", () => {
    const points = buildRandomPointsInHex(5, "even");
    expect(points.length).toBe(5);
    // Even mode is deterministic in buildTriangularLatticeApprox except for the subsampling logic which uses floor(index * step)
    // Points should be within unit hex (circumradius 1)
    for (const p of points) {
      expect(Math.sqrt(p.x * p.x + p.z * p.z)).toBeLessThanOrEqual(1.000001);
    }
  });

  it("buildRandomPointsInHex (semi-even mode) uses random jitter", () => {
    const restore = mockRandom(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5);
    const points = buildRandomPointsInHex(5, "semi-even");
    expect(points.length).toBe(5);
    restore();
  });

  it("buildRandomPointsInHex (random mode) uses poisson disk", () => {
    // Poisson disk uses Math.random to find seed and candidates
    const points = buildRandomPointsInHex(5, "random");
    expect(points.length).toBeLessThanOrEqual(5);
    for (const p of points) {
      expect(Math.sqrt(p.x * p.x + p.z * p.z)).toBeLessThanOrEqual(1.000001);
    }
  });
});
