import { EngineCoords } from "@/Player/Human/Terrain/_terrainMeshTypes";

// Pointy-top hexagon with circumradius fixed to 1.0
// Project uses hard-coded hexWidth = sqrt(3) and hexDepth = 1.5 in math.ts, which
// corresponds to a unit circumradius hex (R=1). We operate in that local space.

export function buildRandomPointsInHex(
  count: number,
  mode: "even" | "semi-even" | "random" = "semi-even",
  minSpace: number = 0.2,
): EngineCoords[] {
  if (mode === "even") {
    return buildTriangularLatticeApprox(count);
  }

  if (mode === "semi-even") {
    const base = buildTriangularLatticeApprox(count);
    const hexArea = (3 * Math.sqrt(3)) / 2;
    const cellArea = Math.sqrt(3) / 2;
    const spacing = Math.sqrt(hexArea / Math.max(1, base.length) / cellArea);
    return jitterWithinHex(base, 0.25 * spacing);
  }

  // random with minimal spacing (blue-noise-ish)
  const hexArea = (3 * Math.sqrt(3)) / 2;
  // Suggest a distance from count if minSpace is tiny; otherwise enforce minSpace
  const suggested = Math.sqrt(hexArea / (Math.PI * Math.max(1, count))) * 0.95;
  const minimumDistance = Math.max(minSpace, suggested);
  return poissonDiskInHex(count, minimumDistance);
}

const HEX_VERTEX_ANGLES = Array.from(
  { length: 6 },
  (_, index) => Math.PI / 6 + index * (Math.PI / 3),
);
const HEX_VERTICES: EngineCoords[] = HEX_VERTEX_ANGLES.map((angle) => ({
  x: Math.cos(angle),
  z: Math.sin(angle),
}));

function isPointInsideUnitHex(point: EngineCoords): boolean {
  // Half-plane checks for a convex polygon (CCW vertices)
  for (let i = 0; i < 6; i++) {
    const vertexA = HEX_VERTICES[i];
    const vertexB = HEX_VERTICES[(i + 1) % 6];
    const edgeX = vertexB.x - vertexA.x;
    const edgeZ = vertexB.z - vertexA.z;
    const relX = point.x - vertexA.x;
    const relZ = point.z - vertexA.z;
    const cross = edgeX * relZ - edgeZ * relX;
    if (cross < 0) return false;
  }
  return true;
}

function buildTriangularLatticeApprox(count: number): EngineCoords[] {
  const hexArea = (3 * Math.sqrt(3)) / 2; // unit hex area
  const cellArea = Math.sqrt(3) / 2; // triangular lattice cell area when spacing is 1
  const spacing = Math.sqrt(hexArea / Math.max(1, count) / cellArea);

  const output: EngineCoords[] = [];
  const verticalStep = (Math.sqrt(3) / 2) * spacing;

  // cover bounding box roughly (-1..1) in both axes, with a small pad
  const pad = spacing * 2;
  const minZ = -1 - pad;
  const maxZ = 1 + pad;
  const minX = -1 - pad;
  const maxX = 1 + pad;

  for (
    let rowIndex = Math.ceil(minZ / verticalStep);
    rowIndex <= Math.floor(maxZ / verticalStep);
    rowIndex++
  ) {
    const z = rowIndex * verticalStep;
    const xOffset = rowIndex & 1 ? spacing / 2 : 0;
    for (
      let colIndex = Math.ceil((minX - xOffset) / spacing);
      colIndex <= Math.floor((maxX - xOffset) / spacing);
      colIndex++
    ) {
      const x = colIndex * spacing + xOffset;
      const candidate: EngineCoords = { x, z };
      if (isPointInsideUnitHex(candidate)) output.push(candidate);
    }
  }

  // If we overshot the desired count, subsample uniformly
  if (output.length > count && count > 0) {
    const step = output.length / count;
    return Array.from({ length: count }, (_, index) => output[Math.floor(index * step)]);
  }
  return output;
}

function jitterWithinHex(points: EngineCoords[], magnitude: number): EngineCoords[] {
  if (magnitude <= 0) return points.slice();
  const output: EngineCoords[] = [];
  for (const point of points) {
    const jitterX = (Math.random() * 2 - 1) * magnitude;
    const jitterZ = (Math.random() * 2 - 1) * magnitude;
    const moved: EngineCoords = { x: point.x + jitterX, z: point.z + jitterZ };
    output.push(isPointInsideUnitHex(moved) ? moved : point);
  }
  return output;
}

function poissonDiskInHex(
  targetCount: number,
  minimumDistance: number,
  maxTriesPerActive = 30,
): EngineCoords[] {
  const boundingBox = { minX: -1, maxX: 1, minZ: -1, maxZ: 1 };
  const gridCell = minimumDistance / Math.SQRT2;
  const gridCountX = Math.ceil((boundingBox.maxX - boundingBox.minX) / gridCell);
  const gridCountZ = Math.ceil((boundingBox.maxZ - boundingBox.minZ) / gridCell);
  const grid: Array<EngineCoords | null> = new Array(gridCountX * gridCountZ).fill(null);
  const activeList: EngineCoords[] = [];
  const samples: EngineCoords[] = [];

  function gridIndex(x: number, z: number): number {
    const ix = Math.floor((x - boundingBox.minX) / gridCell);
    const iz = Math.floor((z - boundingBox.minZ) / gridCell);
    return iz * gridCountX + ix;
  }
  function isNearExisting(point: EngineCoords): boolean {
    const ix = Math.floor((point.x - boundingBox.minX) / gridCell);
    const iz = Math.floor((point.z - boundingBox.minZ) / gridCell);
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        const jx = ix + dx;
        const jz = iz + dz;
        if (jx < 0 || jx >= gridCountX || jz < 0 || jz >= gridCountZ) continue;
        const neighbor = grid[jz * gridCountX + jx];
        if (!neighbor) continue;
        const deltaX = neighbor.x - point.x;
        const deltaZ = neighbor.z - point.z;
        if (deltaX * deltaX + deltaZ * deltaZ < minimumDistance * minimumDistance) return true;
      }
    }
    return false;
  }
  function pushPoint(point: EngineCoords) {
    activeList.push(point);
    samples.push(point);
    grid[gridIndex(point.x, point.z)] = point;
  }

  // seed in-hex random point
  for (let tries = 0; tries < 100 && samples.length === 0; tries++) {
    const candidate: EngineCoords = { x: Math.random() * 2 - 1, z: Math.random() * 2 - 1 };
    if (isPointInsideUnitHex(candidate)) pushPoint(candidate);
  }

  while (activeList.length && samples.length < targetCount) {
    const activeIndex = Math.floor(Math.random() * activeList.length);
    const base = activeList[activeIndex];
    let placed = false;
    for (let trial = 0; trial < maxTriesPerActive; trial++) {
      const distance = minimumDistance * (1 + Math.random());
      const angle = Math.random() * Math.PI * 2;
      const candidate: EngineCoords = {
        x: base.x + distance * Math.cos(angle),
        z: base.z + distance * Math.sin(angle),
      };
      if (!isPointInsideUnitHex(candidate)) continue;
      if (isNearExisting(candidate)) continue;
      pushPoint(candidate);
      placed = true;
      break;
    }
    if (!placed) activeList.splice(activeIndex, 1);
  }
  return samples;
}
