// noinspection PointlessArithmeticExpressionJS

// Weld vertices by quantized X/Z to ensure smooth shading across hex seams.
// Colors are averaged alongside positions. Degenerate triangles are dropped.
import { TerrainTileBuffers } from "@/engine/TerrainMesh/_terrainMeshTypes";

export function weldGpuBuffer(
  positions: number[],
  colors: number[],
  indices: number[],
  eps = 1e-4,
): TerrainTileBuffers {
  const vCount = Math.floor(positions.length / 3);
  const keyOf = (x: number, z: number): string => `${Math.round(x / eps)},${Math.round(z / eps)}`;

  type Acc = {
    sx: number;
    sy: number;
    sz: number;
    sr: number;
    sg: number;
    sb: number;
    sa: number;
    n: number;
  };

  const groups = new Map<string, Acc>();
  const vKeys: string[] = new Array(vCount);

  for (let i = 0; i < vCount; i++) {
    const x = positions[3 * i + 0];
    const y = positions[3 * i + 1];
    const z = positions[3 * i + 2];
    const r = colors[4 * i + 0] ?? 0;
    const g = colors[4 * i + 1] ?? 0;
    const b = colors[4 * i + 2] ?? 0;
    const a = colors[4 * i + 3] ?? 1;
    const k = keyOf(x, z);
    vKeys[i] = k;
    const acc = groups.get(k);
    if (acc) {
      acc.sx += x;
      acc.sy += y;
      acc.sz += z;
      acc.sr += r;
      acc.sg += g;
      acc.sb += b;
      acc.sa += a;
      acc.n += 1;
    } else {
      groups.set(k, { sx: x, sy: y, sz: z, sr: r, sg: g, sb: b, sa: a, n: 1 });
    }
  }

  const keyToNew = new Map<string, number>();
  const nVerts = groups.size;
  const posOut = new Array<number>(nVerts * 3);
  const colOut = new Array<number>(nVerts * 4);
  let cursor = 0;
  for (const [k, acc] of groups) {
    const inv = 1 / acc.n;
    posOut[3 * cursor + 0] = acc.sx * inv;
    posOut[3 * cursor + 1] = acc.sy * inv;
    posOut[3 * cursor + 2] = acc.sz * inv;
    colOut[4 * cursor + 0] = acc.sr * inv;
    colOut[4 * cursor + 1] = acc.sg * inv;
    colOut[4 * cursor + 2] = acc.sb * inv;
    colOut[4 * cursor + 3] = acc.sa * inv;
    keyToNew.set(k, cursor);
    cursor++;
  }

  const idxOut: number[] = [];
  for (let t = 0; t < indices.length; t += 3) {
    const i0 = keyToNew.get(vKeys[indices[t + 0]]) as number;
    const i1 = keyToNew.get(vKeys[indices[t + 1]]) as number;
    const i2 = keyToNew.get(vKeys[indices[t + 2]]) as number;
    if (i0 === i1 || i1 === i2 || i2 === i0) continue;
    idxOut.push(i0, i1, i2);
  }

  return { positions: posOut, colors: colOut, indices: idxOut };
}
