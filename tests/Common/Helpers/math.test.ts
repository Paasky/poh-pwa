import { describe, expect, it } from "vitest";
import * as MathHelpers from "@/Common/Helpers/math";
import { wrapInclusive } from "@/Common/Helpers/math";
import { expectFloatsToBeClose } from "../../_setup/testHelpers";
import { Tile } from "@/Common/Models/Tile";

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
  describe("basicMath", () => {
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

      // min > max (should behave according to Math.max(min, Math.min(max, val)))
      // Math.min(0, 5) -> 0, Math.max(10, 0) -> 10
      expect(clamp(5, 10, 0)).toBe(10);
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
      // wrapInclusive
      // 13th month is January
      expect(wrapInclusive(13, 1, 12)).toBe(1);
      expect(wrapInclusive(1, 1, 12)).toBe(1);
      expect(wrapInclusive(12, 1, 12)).toBe(12);
      expect(wrapInclusive(0, 1, 12)).toBe(12);
      expect(wrapInclusive(-1, 1, 12)).toBe(11);

      // wrapExclusive
      expect(wrapExclusive(5, 0, 10)).toBe(5);
      expect(wrapExclusive(12, 0, 10)).toBe(2);
      expect(wrapExclusive(-2, 0, 10)).toBe(8);
      expect(wrapExclusive(10, 0, 10)).toBe(0);
      expect(wrapExclusive(0, 0, 10)).toBe(0);

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
  });

  describe("hex extents", () => {
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

      // Wrapping doesn't apply to tileCenter logic itself, it just takes x,y
      const centerOutside = tileCenter(size, { x: 10, y: 0 });
      expectFloatsToBeClose(centerOutside.x, center00.x + hexWidth * 10);
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

      // Out of bounds percentages should be clamped
      expectFloatsToBeClose(MathHelpers.getEngineCoordsFromPercent(size, -1, 2), {
        x: topLeft.x,
        z: bottomRight.z,
      });
    });
  });

  describe("directions", () => {
    it("trigonometry Helpers", () => {
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
  });

  describe("bounds and orthographic Helpers", () => {
    const size = { x: 10, y: 10 };

    it("getMapBounds and getFullWorldOrthoBounds", () => {
      const bounds = MathHelpers.getMapBounds(size);
      expect(bounds.worldWidth).toBe(getWorldWidth(size.x));
      expect(bounds.worldDepth).toBe(getWorldDepth(size.y));

      const ortho = MathHelpers.getFullWorldOrthoBounds(size);
      expect(ortho.left).toBe(-bounds.worldWidth / 2);
      expect(ortho.right).toBe(bounds.worldWidth / 2);
      expect(ortho.bottom).toBe(-bounds.worldDepth / 2);
      expect(ortho.top).toBe(bounds.worldDepth / 2);
    });

    it("calculateKnownBounds", () => {
      // Empty input
      const emptyBounds = MathHelpers.calculateKnownBounds(size, []);
      expect(emptyBounds).toEqual({ left: -10, right: 10, bottom: -10, top: 10 });

      // Single tile
      const singleKey = Tile.getKey(0, 0);
      const singleBounds = MathHelpers.calculateKnownBounds(size, [singleKey]);
      const center00 = tileCenter(size, { x: 0, y: 0 });
      expectFloatsToBeClose(singleBounds.left, center00.x - hexWidth / 2);
      expectFloatsToBeClose(singleBounds.right, center00.x + hexWidth / 2);
      expectFloatsToBeClose(singleBounds.bottom, center00.z - hexDepth / 2);
      expectFloatsToBeClose(singleBounds.top, center00.z + hexDepth / 2);

      // Multiple tiles
      const keys = [Tile.getKey(0, 0), Tile.getKey(1, 1)];
      const multiBounds = MathHelpers.calculateKnownBounds(size, keys);
      expect(multiBounds.left).toBeLessThan(multiBounds.right);
      expect(multiBounds.bottom).toBeLessThan(multiBounds.top);
    });

    it("calculateMinimapCameraBounds", () => {
      const knownBounds = { left: -5, right: 5, bottom: -5, top: 5 };

      // Square canvas, square bounds
      const squareMinimap = MathHelpers.calculateMinimapCameraBounds(knownBounds, 100, 100);
      // It will expand to min height if needed. 12 tiles * 1.5 = 18.
      // 5 - (-5) = 10 < 18.
      // So height becomes 18, z from -9 to 9.
      // Target ratio is 1. Current width is 10. Actual height is 18.
      // currentRatio (10/18) < targetRatio (1).
      // diff = (18 * 1 - 10) / 2 = 4.
      // x from -5-4=-9 to 5+4=9.
      expect(squareMinimap.left).toBe(-9);
      expect(squareMinimap.right).toBe(9);
      expect(squareMinimap.bottom).toBe(-9);
      expect(squareMinimap.top).toBe(9);

      // Wide canvas
      const wideMinimap = MathHelpers.calculateMinimapCameraBounds(knownBounds, 200, 100);
      // height is 18, ratio is 2. Width should be 36.
      // x from -5-13=-18 to 5+13=18.
      expect(wideMinimap.right - wideMinimap.left).toBe(36);
      expect(wideMinimap.top - wideMinimap.bottom).toBe(18);
    });

    it("clampCoordsToBoundaries", () => {
      const worldOrtho = MathHelpers.getFullWorldOrthoBounds(size);
      const { worldWidth, minX: worldMinX } = MathHelpers.getMapBounds(size);

      // No known bounds - clamp to world
      const c1 = { x: 0, z: 100 };
      const r1 = MathHelpers.clampCoordsToBoundaries(c1, size, null);
      expect(r1.z).toBe(worldOrtho.top);

      // Wrapping X
      const c2 = { x: worldMinX + worldWidth + 1, z: 0 };
      const r2 = MathHelpers.clampCoordsToBoundaries(c2, size, null);
      expectFloatsToBeClose(r2.x, worldMinX + 1);

      const c3 = { x: worldMinX - 1, z: 0 };
      const r3 = MathHelpers.clampCoordsToBoundaries(c3, size, null);
      expectFloatsToBeClose(r3.x, worldMinX + worldWidth - 1);

      // With known bounds
      const knownBounds = { left: -2, right: 2, bottom: -2, top: 2 };
      const c4 = { x: 5, z: 5 };
      const r4 = MathHelpers.clampCoordsToBoundaries(c4, size, knownBounds);
      expect(r4.x).toBe(2);
      expect(r4.z).toBe(2);
    });
  });
});
