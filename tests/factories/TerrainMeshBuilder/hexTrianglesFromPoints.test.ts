import { describe, expect, it } from "vitest";
import { hexTrianglesFromPoints } from "../../../src/factories/TerrainMeshBuilder/hexTrianglesFromPoints";
import {
  validCenterData,
  validK1Data,
  validK2Data,
  validK3Data,
  validK4Data,
} from "./pointsInHexRing.test";

describe("hexTrianglesFromPoints", () => {
  it("K1 output", () => {
    expect(hexTrianglesFromPoints([validCenterData, ...validK1Data.ring1], 1)).toEqual(
      validK1Triangles,
    );
  });

  it("K2 output", () => {
    expect(
      hexTrianglesFromPoints([validCenterData, ...validK2Data.ring1, ...validK2Data.ring2], 2),
    ).toEqual(validK2Triangles);
  });

  it("K3 output", () => {
    expect(
      hexTrianglesFromPoints(
        [validCenterData, ...validK3Data.ring1, ...validK3Data.ring2, ...validK3Data.ring3],
        3,
      ),
    ).toEqual(validK3Triangles);
  });

  it("K4 output", () => {
    expect(
      hexTrianglesFromPoints(
        [
          validCenterData,
          ...validK4Data.ring1,
          ...validK4Data.ring2,
          ...validK4Data.ring3,
          ...validK4Data.ring4,
        ],
        4,
      ),
    ).toEqual(validK4Triangles);
  });
});

/* pointy-top:
       n
       1
     /    \
nw 2        6 ne
   |   0 c  |
sw 3        5 se
     \    /
       4
       s
 */
// NOTE: In Babylon, reality is flipped: triangles are build clockwise but Babylon understands that as counter-clockwise (eg what it wants)
const validK1Triangles = [
  // CCW: NW, N, center
  2, 1, 0,

  // SW, NW, center
  3, 2, 0,

  // S, SW, center
  4, 3, 0,

  // SE, S, center
  5, 4, 0,

  // NE, SE, center
  6, 5, 0,

  // N, NE, center
  1, 6, 0,
];
const validK2Triangles = [
  // N edge
  1,
  7,
  2, // innerA, outerA, innerB
  2,
  7,
  8, // innerB, outerA, outerB

  // NW edge
  2,
  9,
  3,
  3,
  9,
  10,

  // SW edge
  3,
  11,
  4,
  4,
  11,
  12,

  // S edge
  4,
  13,
  5,
  5,
  13,
  14,

  // SE edge
  5,
  15,
  6,
  6,
  15,
  16,

  // NE edge
  6,
  17,
  1,
  1,
  17,
  18,
];
const validK3Triangles = [
  // Ring1 (center → ring1)
  2,
  1,
  0,
  3,
  2,
  0,
  4,
  3,
  0,
  5,
  4,
  0,
  6,
  5,
  0,
  1,
  6,
  0,

  // Ring2 (ring1 → ring2)
  1,
  7,
  2,
  2,
  7,
  8,
  2,
  9,
  3,
  3,
  9,
  10,
  3,
  11,
  4,
  4,
  11,
  12,
  4,
  13,
  5,
  5,
  13,
  14,
  5,
  15,
  6,
  6,
  15,
  16,
  6,
  17,
  1,
  1,
  17,
  18,

  // Ring3 (ring2 → ring3)
  7,
  19,
  8,
  8,
  19,
  20, // N edge
  8,
  21,
  9,
  9,
  21,
  22, // NW edge
  9,
  23,
  10,
  10,
  23,
  24, // SW edge
  10,
  25,
  11,
  11,
  25,
  26, // S edge
  11,
  27,
  12,
  12,
  27,
  28, // SE edge
  12,
  29,
  13,
  13,
  29,
  30, // NE edge
  13,
  31,
  14,
  14,
  31,
  32, // N edge wrap
  14,
  33,
  15,
  15,
  33,
  34,
  15,
  35,
  16,
  16,
  35,
  36,
  16,
  19,
  17,
  17,
  19,
  20, // final wrap to ring2 start
  17,
  21,
  18,
  18,
  21,
  22,
  18,
  23,
  19,
  19,
  23,
  24,
];
const validK4Triangles = [
  // Ring1 (center → ring1)
  2, 1, 0, 3, 2, 0, 4, 3, 0, 5, 4, 0, 6, 5, 0, 1, 6, 0,

  // Ring2 (ring1 → ring2)
  1, 7, 2, 2, 7, 8, 2, 9, 3, 3, 9, 10, 3, 11, 4, 4, 11, 12, 4, 13, 5, 5, 13, 14, 5, 15, 6, 6, 15,
  16, 6, 17, 1, 1, 17, 18,

  // Ring3 (ring2 → ring3)
  7, 19, 8, 8, 19, 20, 8, 21, 9, 9, 21, 22, 9, 23, 10, 10, 23, 24, 10, 25, 11, 11, 25, 26, 11, 27,
  12, 12, 27, 28, 12, 29, 13, 13, 29, 30, 13, 31, 14, 14, 31, 32, 14, 33, 15, 15, 33, 34, 15, 35,
  16, 16, 35, 36, 16, 37, 17, 17, 37, 18, 17, 39, 18, 18, 39, 19, 18, 41, 7, 7, 41, 20,

  // Ring4 (ring3 → ring4)
  19, 37, 20, 20, 37, 38, 20, 39, 21, 21, 39, 40, 21, 41, 22, 22, 41, 42, 22, 43, 23, 23, 43, 44,
  23, 45, 24, 24, 45, 46, 24, 47, 25, 25, 47, 48, 25, 49, 26, 26, 49, 50, 26, 51, 27, 27, 51, 52,
  27, 53, 28, 28, 53, 54, 28, 55, 29, 29, 55, 56, 29, 57, 30, 30, 57, 58, 30, 59, 31, 31, 59, 60,
  31, 61, 32, 32, 61, 37, 32, 63, 33, 33, 63, 38, 33, 65, 34, 34, 65, 39, 34, 67, 35, 35, 67, 40,
  35, 69, 36, 36, 69, 41, 36, 71, 19, 19, 71, 42,
];
