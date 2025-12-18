import type { Scene } from "@babylonjs/core";
import {
  type AbstractMesh,
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { Tile } from "@/objects/game/Tile";
import type { GameKey } from "@/objects/game/_GameObject";
import type { Coords } from "@/helpers/mapTools";
import { tileHeight } from "@/helpers/mapTools";
import { tileCenter } from "@/helpers/math";
import { watch } from "vue";
import { useSettingsStore } from "@/stores/settingsStore";

// ---- Tuning constants (adjust freely) ----
export const GRID_COLOR = new Color3(1, 1, 1); // white
export const GRID_ALPHA = 0.5; // 0..1
export const GRID_CHUNK_SIZE = 32; // tiles per chunk (x and y)
// Note: WebGL line width is platform-limited; kept for future shader-based thickness
export const GRID_LINE_WIDTH = 1;

/** Chunked hex grid overlay using Babylon LineSystem meshes. */
export class GridOverlay {
  private scene: Scene;
  private root: TransformNode;
  private chunks: AbstractMesh[] = [];

  private size: Coords;
  private tilesByKey: Record<GameKey, Tile>;
  private totalLinesCount = 0;

  constructor(scene: Scene, size: Coords, tilesByKey: Record<GameKey, Tile>) {
    this.scene = scene;
    this.size = size;
    this.tilesByKey = tilesByKey;
    this.root = new TransformNode("gridOverlayRoot", scene);

    // Build chunks covering the whole map
    this.totalLinesCount = 0;
    for (let y0 = 0; y0 < this.size.y; y0 += GRID_CHUNK_SIZE) {
      for (let x0 = 0; x0 < this.size.x; x0 += GRID_CHUNK_SIZE) {
        const x1 = Math.min(this.size.x, x0 + GRID_CHUNK_SIZE);
        const y1 = Math.min(this.size.y, y0 + GRID_CHUNK_SIZE);
        this.buildChunk(x0, y0, x1, y1);
      }
    }

    const settings = useSettingsStore();
    this.root.setEnabled(settings.engineSettings.showGrid);
    watch(
      () => settings.engineSettings.showGrid,
      (visible) => this.root.setEnabled(visible),
    );
  }

  dispose(): void {
    for (const c of this.chunks) c.dispose();
    this.root.dispose();
    this.chunks = [];
  }

  private buildChunk(x0: number, y0: number, x1: number, y1: number): void {
    const lines: Vector3[][] = [];

    for (let ty = y0; ty < y1; ty++) {
      for (let tx = x0; tx < x1; tx++) {
        // Use the project's canonical tile key format
        const key = Tile.getKey(tx, ty) as GameKey;
        const tile = this.tilesByKey[key];
        if (!tile) continue;

        // Hex geometry around center (pointy-top, radius = 1 world unit)
        const center = tileCenter(this.size, tile);
        const radius = 1; // matches math.ts spacing (hexDepth 1.5 => R=1)
        // Follow tile height for water, stick to max 0 on land
        const y = Math.min(0, tileHeight(tile, true));

        const vertices = GridOverlay.hexVertices(center.x, center.z, radius, y);

        // To avoid duplicate edges between neighbors, draw only 3 edges per tile:
        // E (v1->v2), SE (v2->v3), SW (v3->v4)
        lines.push([vertices[1], vertices[2]]);
        lines.push([vertices[2], vertices[3]]);
        lines.push([vertices[3], vertices[4]]);
      }
    }

    if (lines.length === 0) return;

    const lineSystem = MeshBuilder.CreateLineSystem(
      `gridChunk_${x0}_${y0}`,
      { lines: lines, updatable: false },
      this.scene,
    );

    // Material for consistent color/alpha and fog behavior
    const mat = new StandardMaterial(`gridMat_${x0}_${y0}`, this.scene);
    mat.disableLighting = true; // unlit overlay look
    mat.emissiveColor = GRID_COLOR.clone();
    mat.alpha = GRID_ALPHA;
    // Draw last without writing depth so it appears above terrain/features
    mat.disableDepthWrite = true;
    lineSystem.material = mat;

    lineSystem.isPickable = false;
    lineSystem.applyFog = true;
    // Rendering layer for overlays
    lineSystem.renderingGroupId = 2; // 0: terrain, 1: features, 2: grid

    lineSystem.parent = this.root;
    this.chunks.push(lineSystem);
    this.totalLinesCount += lines.length;
  }

  /**
   * Adjust perceived grid thickness (proxy). WebGL line width is fixed on most platforms,
   * so we simulate thickness by adjusting alpha to make lines appear bolder/thinner.
   *
   * expectedScale: 0.5 (thinner) .. 2.0 (bolder)
   */
  setThicknessScale(expectedScale: number): void {
    const scale = Math.max(0.5, Math.min(2.0, expectedScale));
    // Map 0.5..2.0 -> alpha 0.35..0.9 linearly
    const alpha = 0.35 + ((scale - 0.5) / 1.5) * (0.9 - 0.35);
    for (const m of this.chunks) {
      const mat = m.material as StandardMaterial | undefined;
      if (mat) mat.alpha = alpha;
    }
  }

  private static hexVertices(
    cx: number,
    cz: number,
    r: number,
    y: number,
  ): [Vector3, Vector3, Vector3, Vector3, Vector3, Vector3] {
    const verts: Vector3[] = [];
    const offset = Math.PI / 6; // 30° pointy-top
    for (let i = 0; i < 6; i++) {
      const a = offset + (Math.PI / 3) * i;
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      verts.push(new Vector3(x, y, z));
    }
    return verts as [Vector3, Vector3, Vector3, Vector3, Vector3, Vector3];
  }
}

export default GridOverlay;
