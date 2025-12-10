import { describe, expect, it } from "vitest";
import { Color4 } from "@babylonjs/core";
import { buildHexGpuBuffer } from "../../../src/factories/TerrainMeshBuilder/buildHexGpuBuffer";
import { TerrainTileBuffers } from "../../../src/factories/TerrainMeshBuilder/_terrainMeshTypes";
import { validCenterData, validK1Data, validK2Data } from "./pointsInHexRing.test";

describe("buildHexGpuBuffer", () => {
  it("writes vertex data in point order and flattens RGBA/XYZ correctly (K1)", () => {
    const points = [...validCenterData, ...validK1Data.ring1];
    const buf: TerrainTileBuffers = { positions: [], colors: [], indices: [] };

    buildHexGpuBuffer(centerA, points, trisK1Small, getColor, getHeight, buf);

    expect(buf.positions).toEqual(expK1PositionsFromCenterA);
    expect(buf.colors).toEqual(expK1Colors);
    expect(buf.indices).toEqual(trisK1Small);
  });

  it("applies center offset (x,z) and inverts Z", () => {
    const points = [
      ...validCenterData,
      validK1Data.ring1[0], // north corner
    ];
    const buf: TerrainTileBuffers = { positions: [], colors: [], indices: [] };

    buildHexGpuBuffer(centerB, points, trisMini, getColor, getHeight, buf);

    // center
    expect(buf.positions.slice(0, 3)).toEqual([centerB.x + 0, heightMap.center, centerB.z - 0]);
    // N corner (z=+1 → centerB.z - 1)
    expect(buf.positions.slice(3, 6)).toEqual([centerB.x + 0, heightMap["1:n"], centerB.z - 1]);
  });

  it("calls getColor/getHeight with correct argument triplets for center, corners, and edges (K2)", () => {
    const points = [...validCenterData, ...validK2Data.ring1, ...validK2Data.ring2];
    const buf: TerrainTileBuffers = { positions: [], colors: [], indices: [] };
    const colorArgs: any[] = [];
    const heightArgs: any[] = [];
    const gc = (r: number, c?: any, e?: any) => {
      colorArgs.push([r, c, e]);
      return getColor(r, c, e);
    };
    const gh = (r: number, c?: any, e?: any) => {
      heightArgs.push([r, c, e]);
      return getHeight(r, c, e);
    };

    buildHexGpuBuffer(centerA, points, trisMini, gc, gh, buf);

    expect(colorArgs.length).toBe(points.length);
    expect(heightArgs.length).toBe(points.length);
    // center
    expect(colorArgs[0]).toEqual([0, undefined, undefined]);
    expect(heightArgs[0]).toEqual([0, undefined, undefined]);
    // has a known ring1 corner
    expect(hasArgs(colorArgs, [1, "n", undefined])).toBe(true);
    // has a known ring2 edge and corner
    expect(hasArgs(colorArgs, [2, undefined, "nw"])).toBe(true);
    expect(hasArgs(colorArgs, [2, "se", undefined])).toBe(true);
  });

  it("offsets indices by existing vertex count when appending to a non-empty buffer", () => {
    const points = [...validCenterData, ...validK1Data.ring1.slice(0, 2)]; // 3 vertices
    const buf: TerrainTileBuffers = {
      positions: [99, 99, 99], // one existing vertex → base = 1
      colors: [9, 9, 9, 9],
      indices: [7, 8, 9],
    };

    buildHexGpuBuffer(centerA, points, [0, 1, 2], getColor, getHeight, buf);
    expect(buf.indices).toEqual([7, 8, 9, 1, 2, 3]);

    // Variation: append twice starting from empty
    const buf2: TerrainTileBuffers = { positions: [], colors: [], indices: [] };
    buildHexGpuBuffer(centerA, points, trisMini, getColor, getHeight, buf2);
    buildHexGpuBuffer(centerA, points, trisMini, getColor, getHeight, buf2);
    const base = points.length; // offset used in 2nd append
    expect(buf2.indices.slice(trisMini.length)).toEqual(trisMini.map((i) => i + base));
  });

  it("does not mutate inputs and supports empty triangles/points", () => {
    const points = [...validCenterData];
    const triangles: number[] = [];
    const pointsCopy = JSON.parse(JSON.stringify(points));
    const trisCopy = triangles.slice();
    const buf: TerrainTileBuffers = { positions: [], colors: [], indices: [42] };

    buildHexGpuBuffer(centerA, points, triangles, getColor, getHeight, buf);

    expect(points).toEqual(pointsCopy);
    expect(triangles).toEqual(trisCopy);
    expect(buf.indices).toEqual([42]); // unchanged
    expect(buf.positions.length).toBe(3);
    expect(buf.colors.length).toBe(4);

    // Empty points → no changes at all (indices should NOT be appended)
    const buf2: TerrainTileBuffers = { positions: [], colors: [], indices: [] };
    buildHexGpuBuffer(centerA, [], [0, 1, 2], getColor, getHeight, buf2);
    expect(buf2.positions.length).toBe(0);
    expect(buf2.colors.length).toBe(0);
    expect(buf2.indices.length).toBe(0);
  });
});

// ----------------------
// Static fixtures (data)
// ----------------------

const centerA = { x: 0, z: 0 };
const centerB = { x: 10, z: -7 };

const colorMap: Record<string, Color4> = {
  center: new Color4(0.1, 0.2, 0.3, 0.4),
  "1:n": new Color4(1, 0, 0, 0.5),
  "1:nw": new Color4(0, 1, 0, 0.5),
  "1:sw": new Color4(0, 0, 1, 0.5),
  "1:s": new Color4(1, 1, 0, 0.5),
  "1:se": new Color4(1, 0, 1, 0.5),
  "1:ne": new Color4(0, 1, 1, 0.5),
  // ring2 (corners + a couple of edges used by validK2Data)
  "2:n": new Color4(0.2, 0.2, 0.2, 0.6),
  "2:nw": new Color4(0.3, 0.2, 0.2, 0.6),
  "2:sw": new Color4(0.2, 0.3, 0.2, 0.6),
  "2:s": new Color4(0.2, 0.2, 0.3, 0.6),
  "2:se": new Color4(0.3, 0.3, 0.2, 0.6),
  "2:ne": new Color4(0.2, 0.3, 0.3, 0.6),
  "2:e": new Color4(0.4, 0.1, 0.1, 0.6),
  "2:w": new Color4(0.1, 0.4, 0.1, 0.6),
};

const heightMap: Record<string, number> = {
  center: 10,
  "1:n": 11,
  "1:nw": 12,
  "1:sw": 13,
  "1:s": 14,
  "1:se": 15,
  "1:ne": 16,
  "2:n": 21,
  "2:nw": 22,
  "2:sw": 23,
  "2:s": 24,
  "2:se": 25,
  "2:ne": 26,
  "2:e": 27,
  "2:w": 28,
};

function keyOf(r: number, corner?: string, edge?: string) {
  if (r === 0) return "center";
  return `${r}:${corner ?? edge}`;
}

const getColor = (r: number, c?: any, e?: any) => colorMap[keyOf(r, c, e)];
const getHeight = (r: number, c?: any, e?: any) => heightMap[keyOf(r, c, e)];

const trisMini = [0, 1, 2];
const trisK1Small = [2, 1, 0, 3, 2, 0, 4, 3, 0, 5, 4, 0, 6, 5, 0, 1, 6, 0];

// Expected flat arrays for the first test based on centerA and validK1Data
const expK1PositionsFromCenterA = [
  // center
  0 + 0,
  heightMap.center,
  0 - 0,
  // ring1 corners in order: n, nw, sw, s, se, ne
  0 + 0,
  heightMap["1:n"],
  0 - 1,
  0 + -Math.sqrt(3) / 2,
  heightMap["1:nw"],
  0 - 0.5,
  0 + -Math.sqrt(3) / 2,
  heightMap["1:sw"],
  0 - -0.5,
  0 + 0,
  heightMap["1:s"],
  0 - -1,
  0 + Math.sqrt(3) / 2,
  heightMap["1:se"],
  0 - -0.5,
  0 + Math.sqrt(3) / 2,
  heightMap["1:ne"],
  0 - 0.5,
];

const expK1Colors = [
  0.1, 0.2, 0.3, 0.4, 1, 0, 0, 0.5, 0, 1, 0, 0.5, 0, 0, 1, 0.5, 1, 1, 0, 0.5, 1, 0, 1, 0.5, 0, 1, 1,
  0.5,
];

function hasArgs(arr: any[][], tuple: any[]) {
  return arr.some((a) => a[0] === tuple[0] && a[1] === tuple[1] && a[2] === tuple[2]);
}
