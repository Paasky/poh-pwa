import { describe, expect, it } from "vitest";
import * as MathHelpers from "../../src/helpers/math";
import { wrapInclusive } from "../../src/helpers/math";
import { expectFloatsToBeClose } from "../_setup/testHelpers";
import { Tile } from "../../src/Common/Models/Tile";

const {
  avg,
  clamp,
  degToRad,
  radToDeg,
  sum,
  wrapExclusive,
  getWorldDepth,
  getWorldWidth,
  getWorldMinX,
  getWorldMinZ,
  getWorldMaxX,
  getWorldMaxZ,
  xInDir,
  zInDir,
  pointInDir,
  tileCenter,
  hexDepth,
  hexWidth,
} = MathHelpers;

describe("math", () => {
  it("avg", () => {
    expect(avg([1, 2, 3])).toBe(2);
    expect(avg([1, 2, 3, 4])).toBe(2.5);
    expect(avg([1, 1, 4])).toBe(2);
    expect(avg([1])).toBe(1);
    expect(avg([])).toBe(0);

    // decimals
    expectFloatsToBeClose(avg([1.1, 2.2, 3.3]), 2.2);
    expectFloatsToBeClose(avg([1.1, 2.2, 3.3, 4.4]), 2.75);
    expectFloatsToBeClose(avg([1.1, 1.1, 4.4]), 2.2);
    expectFloatsToBeClose(avg([1.1]), 1.1);
    expectFloatsToBeClose(avg([]), 0);

    // negatives
    expect(avg([-1, -2, -3])).toBe(-2);
    expect(avg([-1, 1])).toBe(0);
    expectFloatsToBeClose(avg([-1.1, 2.2]), 0.55);
  });

  it("clamp", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);

    // decimals
    expectFloatsToBeClose(clamp(5.5, -0.1, 10.1), 5.5);
    expectFloatsToBeClose(clamp(-0.5, -0.1, 10.1), -0.1);
    expectFloatsToBeClose(clamp(10.5, -0.1, 10.1), 10.1);

    // boundaries
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);

    // negative ranges
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-15, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });

  it("degToRad / radToDeg", () => {
    expect(degToRad(180)).toBe(Math.PI);
    expect(radToDeg(Math.PI)).toBe(180);
    expectFloatsToBeClose(degToRad(90), Math.PI / 2);
    expectFloatsToBeClose(radToDeg(Math.PI / 2), 90);

    // zero
    expect(degToRad(0)).toBe(0);
    expect(radToDeg(0)).toBe(0);

    // 360
    expectFloatsToBeClose(degToRad(360), Math.PI * 2);
    expectFloatsToBeClose(radToDeg(Math.PI * 2), 360);

    // negatives
    expectFloatsToBeClose(degToRad(-90), -Math.PI / 2);
    expectFloatsToBeClose(radToDeg(-Math.PI / 2), -90);

    // large angles
    expectFloatsToBeClose(degToRad(720), Math.PI * 4);
    expectFloatsToBeClose(radToDeg(Math.PI * 4), 720);
  });

  it("sum", () => {
    expect(sum([1, 2, 3])).toBe(6);
    expect(sum([])).toBe(0);
    expectFloatsToBeClose(sum([1.1, 2.2]), 3.3);

    // negatives
    expect(sum([-1, -2, 3])).toBe(0);
    expectFloatsToBeClose(sum([-1.1, -2.2]), -3.3);

    // single
    expect(sum([10])).toBe(10);
  });

  it("wrap", () => {
    // 13th month is January
    expect(wrapInclusive(13, 1, 12)).toBe(1);

    expect(wrapExclusive(5, 0, 10)).toBe(5);
    expect(wrapExclusive(12, 0, 10)).toBe(2);
    expect(wrapExclusive(-2, 0, 10)).toBe(8);
    expect(wrapExclusive(10, 0, 10)).toBe(0);

    // multiple wraps
    expect(wrapExclusive(25, 0, 10)).toBe(5);
    expect(wrapExclusive(-15, 0, 10)).toBe(5);
    expect(wrapExclusive(30, 0, 10)).toBe(0);

    // decimals
    expectFloatsToBeClose(wrapExclusive(10.5, 0, 10), 0.5);
    expectFloatsToBeClose(wrapExclusive(-0.5, 0, 10), 9.5);

    // varied range
    expect(wrapExclusive(5, 2, 7)).toBe(5);
    expect(wrapExclusive(8, 2, 7)).toBe(3);
    expect(wrapExclusive(1, 2, 7)).toBe(6);
  });

  it("world extents", () => {
    expect(getWorldDepth(1)).toBe(0);
    expect(getWorldDepth(3)).toBe(3);
    expect(getWorldDepth(10)).toBe(13.5);

    expectFloatsToBeClose(getWorldWidth(1), hexWidth / 2);
    expectFloatsToBeClose(getWorldWidth(2), hexWidth * 1.5);
    expectFloatsToBeClose(getWorldWidth(3), hexWidth * 2.5);

    const w = 10;
    const d = 20;
    expect(getWorldMinX(w)).toBe(-5);
    expect(getWorldMaxX(w)).toBe(5);
    expect(getWorldMinZ(d)).toBe(10);
    expect(getWorldMaxZ(d)).toBe(-10);

    // Symmetry
    expect(getWorldMinX(w)).toBe(-getWorldMaxX(w));
    expect(getWorldMinZ(d)).toBe(-getWorldMaxZ(d));
  });

  it("directions", () => {
    expectFloatsToBeClose(xInDir(0, 10), 10);
    expectFloatsToBeClose(zInDir(0, 10), 0);
    expectFloatsToBeClose(xInDir(Math.PI / 2, 10), 0);
    expectFloatsToBeClose(zInDir(Math.PI / 2, 10), 10);

    // 180 degrees
    expectFloatsToBeClose(xInDir(Math.PI, 10), -10);
    expectFloatsToBeClose(zInDir(Math.PI, 10), 0);

    // 270 degrees
    expectFloatsToBeClose(xInDir((3 * Math.PI) / 2, 10), 0);
    expectFloatsToBeClose(zInDir((3 * Math.PI) / 2, 10), -10);

    // 45 degrees
    const diag = 10 / Math.sqrt(2);
    expectFloatsToBeClose(xInDir(Math.PI / 4, 10), diag);
    expectFloatsToBeClose(zInDir(Math.PI / 4, 10), diag);

    expectFloatsToBeClose(pointInDir(0, 10), { x: 10, z: 0 });
    expectFloatsToBeClose(pointInDir(Math.PI, 5), { x: -5, z: 0 });
  });

  it("tileCenter", () => {
    const size = { x: 10, y: 10 };
    const center00 = tileCenter(size, { x: 0, y: 0 });
    expectFloatsToBeClose(center00, {
      x: getWorldMinX(getWorldWidth(size.x)),
      z: getWorldMinZ(getWorldDepth(size.y)),
    });

    // Row 1 (odd row, should be shifted)
    const center01 = tileCenter(size, { x: 0, y: 1 });
    expectFloatsToBeClose(center01, {
      x: center00.x + hexWidth * 0.5,
      z: center00.z - hexDepth,
    });

    // Row 2 (even row, no additional shift from row 0)
    const center02 = tileCenter(size, { x: 0, y: 2 });
    expectFloatsToBeClose(center02, {
      x: center00.x,
      z: center00.z - hexDepth * 2,
    });
  });

  it("bounds and orthographic helpers", () => {
    const size = { x: 10, y: 10 };
    const bounds = MathHelpers.getMapBounds(size);
    expect(bounds.worldWidth).toBe(getWorldWidth(size.x));
    expect(bounds.worldDepth).toBe(getWorldDepth(size.y));

    const ortho = MathHelpers.getFullWorldOrthoBounds(size);
    expect(ortho.left).toBe(-bounds.worldWidth / 2);
    expect(ortho.right).toBe(bounds.worldWidth / 2);

    // calculateKnownBounds
    const knownKeys = [Tile.getKey(0, 0), Tile.getKey(1, 1)];
    const knownBounds = MathHelpers.calculateKnownBounds(size, knownKeys);
    expect(knownBounds.left).toBeLessThan(knownBounds.right);
    expect(knownBounds.bottom).toBeLessThan(knownBounds.top);

    // calculateMinimapCameraBounds
    const minimapBounds = MathHelpers.calculateMinimapCameraBounds(knownBounds, 100, 100);
    expect(minimapBounds.left).toBeLessThan(minimapBounds.right);

    // clampCoordsToBoundaries
    const coords = { x: 100, z: 100 };
    const clamped = MathHelpers.clampCoordsToBoundaries(coords, size, null);
    expect(clamped.x).toBeLessThan(100);
    expect(clamped.z).toBeLessThan(100);
  });

  it("getEngineCoordsFromPercent", () => {
    const size = { x: 10, y: 10 };
    const topLeft = MathHelpers.getEngineCoordsFromPercent(size, 0, 0);
    const center = MathHelpers.getEngineCoordsFromPercent(size, 0.5, 0.5);
    const bottomRight = MathHelpers.getEngineCoordsFromPercent(size, 1, 1);

    expectFloatsToBeClose(topLeft, {
      x: getWorldMinX(getWorldWidth(size.x)),
      z: getWorldMinZ(getWorldDepth(size.y)),
    });
    expectFloatsToBeClose(center, { x: 0, z: 0 });
    expectFloatsToBeClose(bottomRight, {
      x: getWorldMaxX(getWorldWidth(size.x)),
      z: getWorldMaxZ(getWorldDepth(size.y)),
    });
  });
});
