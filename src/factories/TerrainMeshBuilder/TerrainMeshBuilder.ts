import { Tile } from "@/objects/game/Tile";
import {
  CompassHexCorner,
  CompassHexEdge,
  Coords,
  getHexCornerNeighbors,
  getHexNeighbor,
  maxWaterHeight,
  tileHeight,
  waterLevel,
} from "@/helpers/mapTools";
import { range } from "@/helpers/arrayTools";
import { pointsInRing } from "@/factories/TerrainMeshBuilder/pointsInRing";
import { hexTrianglesFromPoints } from "@/factories/TerrainMeshBuilder/hexTrianglesFromPoints";
import { colorOf, terrainColorMap } from "@/assets/materials/terrains";
import { Color4, Mesh, Scene, TransformNode } from "@babylonjs/core";
import { avg, clamp, tileCenter } from "@/helpers/math";
import { buildHexGpuBuffer } from "@/factories/TerrainMeshBuilder/buildHexGpuBuffer";
import {
  HexMeshConf,
  PointData,
  TerrainTileBuffers,
} from "@/factories/TerrainMeshBuilder/_terrainMeshTypes";
import { weldGpuBuffer } from "@/factories/TerrainMeshBuilder/weldGpuBuffer";
import { createWaterMesh } from "@/factories/TerrainMeshBuilder/waterMesh";
import { meshFromWeld } from "@/factories/TerrainMeshBuilder/meshFromWeld";

export class TerrainMeshBuilder {
  scene: Scene;
  size: Coords;
  tilesByKey: Record<string, Tile>;
  hexRingCount: number;

  root: TransformNode;
  points: PointData[] = [];
  triangles: number[] = [];

  gpuBuffer: TerrainTileBuffers = {
    positions: [],
    colors: [],
    indices: [],
  };

  mesh: Mesh;
  waterMesh: Mesh;
  waterDispose: () => void;

  snowColor = terrainColorMap["terrainType:snow"];

  constructor(
    scene: Scene,
    size: Coords,
    tilesByKey: Record<string, Tile>,
    hexRingCount: number = 3,
  ) {
    this.scene = scene;
    this.size = size;
    this.tilesByKey = tilesByKey;
    this.hexRingCount = hexRingCount;

    this.root = new TransformNode("terrainRoot", this.scene);
    this.points = range(0, hexRingCount).flatMap((ring) => pointsInRing(ring, hexRingCount));
    this.triangles = hexTrianglesFromPoints(this.points, hexRingCount);

    // Step 1: Build Hex GPU Buffer
    for (let tileY = 0; tileY < this.size.y; tileY++) {
      for (let tileX = 0; tileX < this.size.x; tileX++) {
        const tile = this.tilesByKey[Tile.getKey(tileX, tileY)];
        if (!tile) throw new Error(`Tile ${tileX},${tileY} not found in tilesByKey`);

        // Build the center vertex of this Tile
        const center: HexMeshConf = {
          ...tileCenter(this.size, tile),
          height: tileHeight(tile),
          color: colorOf(tile, true),
        };

        // Build GPU Buffer for all vertices of this Tile
        buildHexGpuBuffer(
          center,
          this.points,
          this.triangles,
          (ringNumFromCenter, corner, edge) =>
            this.getColor(center, tile, ringNumFromCenter, corner, edge),
          (ringNumFromCenter, corner, edge) =>
            this.getHeight(center, tile, ringNumFromCenter, corner, edge),
          this.gpuBuffer,
        );
      }
    }

    // Step 2: Weld the pieces together into a single mesh
    const welded = weldGpuBuffer(
      this.gpuBuffer.positions,
      this.gpuBuffer.colors,
      this.gpuBuffer.indices,
    );

    // Step 3: Create the mesh
    this.mesh = meshFromWeld(this.scene, this.root, welded);

    // Simple world-sized water plane to denote global sea level
    const water = createWaterMesh(this.scene, this.size, this.root);
    this.waterMesh = water.mesh;
    this.waterDispose = water.dispose;

    return this;
  }

  dispose() {
    this.gpuBuffer = {
      positions: [],
      colors: [],
      indices: [],
    };

    this.mesh.dispose();
    this.waterDispose();

    // Note: Keep the root as other things may be attached to it, we are just clearing our internal data
  }

  getMesh(): Mesh | null {
    return this.mesh;
  }

  getWaterMesh(): Mesh | null {
    return this.waterMesh;
  }

  // If corner and edge are both undefined, assume it's the center vertex
  private getColor(
    center: HexMeshConf,
    tile: Tile,
    ringNumFromCenter: number,
    corner?: CompassHexCorner,
    edge?: CompassHexEdge,
  ) {
    // center-ish vertex
    if (ringNumFromCenter <= 1) return center.color;

    // The closer to the center, the more we emphasize the center
    const affectingColors = this.centerAffection(ringNumFromCenter, center.color);

    // Only affect E-SW in the compass to prevent cross-contamination
    if (corner && ["se", "s", "sw"].includes(corner)) {
      const cornerNeighbors = getHexCornerNeighbors(this.size, tile, this.tilesByKey, corner);
      for (const neighbor of [cornerNeighbors[0], cornerNeighbors[1]]) {
        // No neighbor -> it's the N/S Pole
        if (!neighbor) {
          affectingColors.push(this.snowColor);
          continue;
        }

        // If we are above water and the neighbor is not, their color cannot affect us
        if (center.height > waterLevel && tileHeight(neighbor) < waterLevel) {
          continue;
        }

        affectingColors.push(colorOf(neighbor));
      }
    }

    // Only affect E-SW in the compass to prevent cross-contamination
    if (edge && ["e", "se", "sw"].includes(edge)) {
      const edgeNeighbor = getHexNeighbor(this.size, tile, this.tilesByKey, edge);

      // No neighbor -> it's the N/S Pole
      if (!edgeNeighbor) {
        affectingColors.push(this.snowColor);
      } else {
        // If we are above water and the neighbor is not, their color cannot affect us
        if (!(center.height > waterLevel && tileHeight(edgeNeighbor) < waterLevel)) {
          affectingColors.push(colorOf(edgeNeighbor));
        }
      }
    }

    return new Color4(
      avg(affectingColors.map((c) => c.r)),
      avg(affectingColors.map((c) => c.g)),
      avg(affectingColors.map((c) => c.b)),
      1,
    );
  }

  // If corner and edge are both undefined, assume it's the center vertex
  private getHeight(
    center: HexMeshConf,
    tile: Tile,
    ringNumFromCenter: number,
    corner?: CompassHexCorner,
    edge?: CompassHexEdge,
  ) {
    // center-ish vertex
    if (ringNumFromCenter <= 0) return tileHeight(tile);

    // The closer to the center, the more we emphasize the center
    const affectingHeights = this.centerAffection(ringNumFromCenter, tileHeight(tile));

    // Only affect E-SW in the compass to prevent cross-contamination
    if (corner && ["se", "s", "sw"].includes(corner)) {
      const cornerNeighbors = getHexCornerNeighbors(this.size, tile, this.tilesByKey, corner);
      affectingHeights.push(
        cornerNeighbors[0] ? tileHeight(cornerNeighbors[0]) : tileHeight(tile),
        cornerNeighbors[1] ? tileHeight(cornerNeighbors[1]) : tileHeight(tile),
      );
    }

    // Only affect E-SW in the compass to prevent cross-contamination
    if (edge && ["e", "se", "sw"].includes(edge)) {
      const edgeNeighbor = getHexNeighbor(this.size, tile, this.tilesByKey, edge);
      affectingHeights.push(edgeNeighbor ? tileHeight(edgeNeighbor) : tileHeight(tile));
    }

    let height = avg(affectingHeights);

    // If we're on the rim, add noise
    if (ringNumFromCenter === this.hexRingCount) {
      // Apply edge-noise only if it's clearly different from the center
      if (height < center.height - 0.1 || height > center.height + 0.1) {
        height += (Math.random() - 0.5) / 5;
      }
    }

    // If we're below the water level, don't rise above it
    if (center.height < waterLevel) {
      return clamp(height, -3, maxWaterHeight);
    }
    return height;
  }

  private centerAffection<T>(ringNumFromCenter: number, fill: T): T[] {
    // 2x emphasis for Center vs. Neighbor
    const centerEmphasis = Math.round(1 / (ringNumFromCenter / this.hexRingCount));
    return Array(centerEmphasis).fill(fill) as T[];
  }
}
