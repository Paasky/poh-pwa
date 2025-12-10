import { Tile } from "@/objects/game/Tile";
import {
  CompassHexCorner,
  CompassHexEdge,
  Coords,
  getHexCornerNeighbors,
  getHexNeighbor,
  tileHeight,
} from "@/helpers/mapTools";
import { range } from "@/helpers/arrayTools";
import { pointsInRing } from "@/factories/TerrainMeshBuilder/pointsInRing";
import { hexTrianglesFromPoints } from "@/factories/TerrainMeshBuilder/hexTrianglesFromPoints";
import { asColor3, colorOf, terrainColorMap } from "@/assets/materials/terrains";
import {
  Color3,
  Color4,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  VertexData,
} from "@babylonjs/core";
import { avg, getWorldDepth, getWorldWidth, tileCenter } from "@/helpers/math";
import { buildHexGpuBuffer } from "@/factories/TerrainMeshBuilder/buildHexGpuBuffer";
import {
  HexMeshConf,
  PointData,
  TerrainTileBuffers,
} from "@/factories/TerrainMeshBuilder/_terrainMeshTypes";
import { weldGpuBuffer } from "@/factories/TerrainMeshBuilder/weldGpuBuffer";

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

  mesh: Mesh | null = null;
  waterMesh: Mesh | null = null;

  snowColor = terrainColorMap["terrainType:snow"];

  constructor(
    scene: Scene,
    size: Coords,
    tilesByKey: Record<string, Tile>,
    hexRingCount: number = 2,
  ) {
    this.scene = scene;
    this.size = size;
    this.tilesByKey = tilesByKey;
    this.hexRingCount = hexRingCount;

    this.root = new TransformNode("terrainRoot", this.scene);
    this.points = range(0, hexRingCount).flatMap((ring) => pointsInRing(ring, hexRingCount));
    this.triangles = hexTrianglesFromPoints(this.points, hexRingCount);
  }

  build(): TerrainMeshBuilder {
    this.dispose();

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
    this.mesh = this.meshFromWeld(welded);

    // Simple world-sized water plane to denote global sea level
    this.waterMesh = this.waterPlane();

    return this;
  }

  dispose() {
    this.gpuBuffer = {
      positions: [],
      colors: [],
      indices: [],
    };
    this.mesh?.dispose();
    this.mesh = null;
    this.waterMesh?.dispose();
    this.waterMesh = null;

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
    // center vertex
    if (!corner && !edge) return center.color;

    // The closer to the center, the more we emphasize the center
    const affectingColors = this.centerAffection(ringNumFromCenter, center.color);

    if (corner) {
      const cornerNeighbors = getHexCornerNeighbors(this.size, tile, this.tilesByKey, corner);
      affectingColors.push(
        cornerNeighbors[0] ? colorOf(cornerNeighbors[0]) : this.snowColor,
        cornerNeighbors[1] ? colorOf(cornerNeighbors[1]) : this.snowColor,
      );
    } else if (edge) {
      const edgeNeighbor = getHexNeighbor(this.size, tile, this.tilesByKey, edge);
      affectingColors.push(edgeNeighbor ? colorOf(edgeNeighbor) : this.snowColor);
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
    // center vertex
    if (!corner && !edge) return center.height;

    // The closer to the center, the more we emphasize the center
    const affectingHeights = this.centerAffection(ringNumFromCenter, center.height);

    if (corner) {
      const cornerNeighbors = getHexCornerNeighbors(this.size, tile, this.tilesByKey, corner);
      affectingHeights.push(
        cornerNeighbors[0] ? tileHeight(cornerNeighbors[0]) : 0,
        cornerNeighbors[1] ? tileHeight(cornerNeighbors[1]) : 0,
      );
    } else if (edge) {
      const edgeNeighbor = getHexNeighbor(this.size, tile, this.tilesByKey, edge);
      affectingHeights.push(edgeNeighbor ? tileHeight(edgeNeighbor) : 0);
    }

    return avg(affectingHeights);
  }

  private centerAffection<T>(ringNumFromCenter: number, fill: T): T[] {
    // 2x emphasis for Center vs. Neighbor
    const centerEmphasis = ringNumFromCenter
      ? 1
      : Math.round((2 * this.hexRingCount) / ringNumFromCenter);
    return Array(centerEmphasis).fill(fill) as T[];
  }

  private meshFromWeld(welded: TerrainTileBuffers): Mesh {
    // Build a single mesh for all tiles from welded buffers
    //   - Compute normals once on the welded geometry for smooth shading
    //   - Apply a matte material (tiles shouldn't have specular highlights)
    const tiles = new Mesh("terrain.tiles", this.scene);
    const vd = new VertexData();
    vd.positions = welded.positions;
    vd.indices = welded.indices;
    vd.colors = welded.colors;
    const normals: number[] = [];
    if (welded.positions.length && welded.indices.length)
      VertexData.ComputeNormals(welded.positions, welded.indices, normals);
    vd.normals = normals;
    vd.applyToMesh(tiles, true);
    const matTiles = new StandardMaterial("terrainMat.tiles", this.scene);
    // Keep tiles matte; specular comes from water plane only
    matTiles.specularColor = Color3.Black();
    tiles.material = matTiles;
    tiles.parent = this.root;

    return tiles;
  }

  private waterPlane(): Mesh {
    const worldWidth = getWorldWidth(this.size.x);
    const worldDepth = getWorldDepth(this.size.y);
    const waterPlane = MeshBuilder.CreateGround(
      "terrain.water.plane",
      { width: worldWidth, height: worldDepth, subdivisions: 1 },
      this.scene,
    );
    // Place below ground level (y=0)
    waterPlane.position.y = -10.2;
    const matWater = new StandardMaterial("terrainMat.water.plane", this.scene);
    matWater.diffuseColor = asColor3(terrainColorMap["terrainType:ocean"]);
    matWater.specularColor = new Color3(0.8, 0.85, 0.95);
    matWater.specularPower = 128;
    matWater.alpha = 0.5; // 50% opacity
    waterPlane.material = matWater;
    waterPlane.parent = this.root;
    return waterPlane;
  }
}
