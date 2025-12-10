// Imports are kept at the top of the file for clarity, tree‑shaking, and bundler friendliness.
// If we ever need code‑splitting or optional dependencies, we will use dynamic imports in a
// very targeted manner. This file does not require them.
import { tileCenter } from "@/helpers/math";
import type { Coords } from "@/helpers/mapTools";
import { Tile } from "@/objects/game/Tile";
import type { GameKey } from "@/objects/game/_GameObject";
import {
  Color3,
  Mesh,
  Nullable,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
  VertexData,
} from "@babylonjs/core";
import type { PickingInfo } from "@babylonjs/core";

/**
 * LogicMeshBuilder
 *
 * An invisible, thin‑instanced hex mesh used for picking and logical interactions.
 * Minimal inputs, clear API, Babylon 8 built‑ins first.
 */
export class LogicMeshBuilder {
  readonly scene: Scene;
  readonly size: Coords;
  readonly tilesByKey: Record<GameKey, Tile>;

  readonly root: TransformNode;
  private baseHexMesh: Mesh | null = null;

  private tileByInstanceIndex: Tile[] = [];
  private instanceIndexByTileKey: Record<GameKey, number> = {};

  private hoverHandlers = new Set<(tile: Tile, details?: LogicPointerDetails) => void>();
  private exitHandlers = new Set<(tile: Tile, details?: LogicPointerDetails) => void>();
  private clickHandlers = new Set<
    (tile: Tile, button: number, details?: LogicPointerDetails) => void
  >();
  private contextHandlers = new Set<(tile: Tile, details?: LogicPointerDetails) => void>();

  private pointerObserver: Nullable<ReturnType<Scene["onPointerObservable"]["add"]>> = null;
  private lastHoveredInstanceIndex: number | null = null;
  private debugEnabled: boolean = false;
  private debugVisibleAlpha: number = 0.2; // semi‑transparent when debugging

  constructor(scene: Scene, size: Coords, tilesByKey: Record<GameKey, Tile>) {
    this.scene = scene;
    this.size = size;
    this.tilesByKey = tilesByKey;
    this.root = new TransformNode("logicRoot", this.scene);
  }

  build(): LogicMeshBuilder {
    this.dispose();

    // Create base flat hex mesh (radius = 1 → matches math.ts spacing)
    this.baseHexMesh = this.createBaseHexMesh();
    this.baseHexMesh.parent = this.root;

    const instanceMatrices = this.buildInstanceMatricesAndMaps();
    const thinInstanceMatrixStride = 16; // 4x4 matrix per instance
    this.baseHexMesh.thinInstanceSetBuffer(
      "matrix",
      instanceMatrices,
      thinInstanceMatrixStride,
      true,
    );

    // Invisible but pickable (unless debug mode is enabled)
    this.baseHexMesh.isPickable = true;
    this.baseHexMesh.thinInstanceEnablePicking = true;
    this.applyDebugVisibility();
    this.baseHexMesh.freezeWorldMatrix();

    this.attachPointerObservers();
    return this;
  }

  dispose(): void {
    if (this.pointerObserver) {
      this.scene.onPointerObservable.remove(this.pointerObserver);
      this.pointerObserver = null;
    }

    this.hoverHandlers.clear();
    this.exitHandlers.clear();
    this.clickHandlers.clear();
    this.contextHandlers.clear();

    this.tileByInstanceIndex = [];
    this.instanceIndexByTileKey = {} as Record<GameKey, number>;
    this.lastHoveredInstanceIndex = null;

    if (this.baseHexMesh) {
      this.baseHexMesh.dispose(false, true);
      this.baseHexMesh = null;
    }

    this.root.getChildren().forEach((n) => n.dispose());
  }

  getRoot(): TransformNode {
    return this.root;
  }

  enable(): void {
    if (this.baseHexMesh) this.baseHexMesh.isPickable = true;
    if (!this.pointerObserver) this.attachPointerObservers();
  }

  disable(): void {
    if (this.baseHexMesh) this.baseHexMesh.isPickable = false;
    if (this.pointerObserver) {
      this.scene.onPointerObservable.remove(this.pointerObserver);
      this.pointerObserver = null;
    }
    if (this.lastHoveredInstanceIndex !== null) {
      const tile = this.tileByInstanceIndex[this.lastHoveredInstanceIndex];
      if (tile) this.exitHandlers.forEach((h) => h(tile));
      this.lastHoveredInstanceIndex = null;
    }
  }

  // Event subscriptions
  onTileHover(handler: (tile: Tile, details?: LogicPointerDetails) => void): () => void {
    this.hoverHandlers.add(handler);
    return () => this.hoverHandlers.delete(handler);
  }

  onTileExit(handler: (tile: Tile, details?: LogicPointerDetails) => void): () => void {
    this.exitHandlers.add(handler);
    return () => this.exitHandlers.delete(handler);
  }

  onTileClick(
    handler: (tile: Tile, button: number, details?: LogicPointerDetails) => void,
  ): () => void {
    this.clickHandlers.add(handler);
    return () => this.clickHandlers.delete(handler);
  }

  onTileContextMenu(handler: (tile: Tile, details?: LogicPointerDetails) => void): () => void {
    this.contextHandlers.add(handler);
    return () => this.contextHandlers.delete(handler);
  }

  // Debug visibility and details toggle
  setDebugEnabled(enabled: boolean): this {
    this.debugEnabled = enabled;
    this.applyDebugVisibility();
    return this;
  }

  toggleDebug(): this {
    return this.setDebugEnabled(!this.debugEnabled);
  }

  isDebugEnabled(): boolean {
    return this.debugEnabled;
  }

  // Internals
  private attachPointerObservers(): void {
    this.pointerObserver = this.scene.onPointerObservable.add((pointerInfo) => {
      if (!this.baseHexMesh) return;

      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERMOVE: {
          const pick = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (m) => m === this.baseHexMesh,
          );
          this.handleHover(pick);
          break;
        }
        case PointerEventTypes.POINTERPICK: {
          const pick = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (m) => m === this.baseHexMesh,
          );
          this.handleClick(pick, pointerInfo.event as PointerEvent);
          break;
        }
      }
    });
  }

  private handleHover(pick: Nullable<import("@babylonjs/core").PickingInfo>): void {
    if (!pick || !pick.hit || pick.thinInstanceIndex === undefined) {
      if (this.lastHoveredInstanceIndex !== null) {
        const tile = this.tileByInstanceIndex[this.lastHoveredInstanceIndex];
        if (tile) this.exitHandlers.forEach((h) => h(tile, this.buildDetails(undefined, undefined)));
        this.lastHoveredInstanceIndex = null;
      }
      return;
    }

    const currentIndex = pick.thinInstanceIndex;
    if (this.lastHoveredInstanceIndex !== currentIndex) {
      if (this.lastHoveredInstanceIndex !== null) {
        const prevTile = this.tileByInstanceIndex[this.lastHoveredInstanceIndex];
        if (prevTile)
          this.exitHandlers.forEach((h) =>
            h(prevTile, this.buildDetails(pick as PickingInfo, undefined)),
          );
      }
      const tile = this.tileByInstanceIndex[currentIndex];
      if (tile)
        this.hoverHandlers.forEach((h) => h(tile, this.buildDetails(pick as PickingInfo, undefined)));
      this.lastHoveredInstanceIndex = currentIndex;
    }
  }

  private handleClick(
    pick: Nullable<import("@babylonjs/core").PickingInfo>,
    ev: PointerEvent,
  ): void {
    if (!pick || !pick.hit || pick.thinInstanceIndex === undefined) return;
    const tile = this.tileByInstanceIndex[pick.thinInstanceIndex];
    if (!tile) return;

    const button = ev.button; // 0 left, 1 middle, 2 right
    const details = this.buildDetails(pick as PickingInfo, ev);
    if (button === 2) this.contextHandlers.forEach((h) => h(tile, details));
    this.clickHandlers.forEach((h) => h(tile, button, details));
  }

  private buildInstanceMatricesAndMaps(): Float32Array {
    const matrices: number[] = [];

    // Stable ordering by y then x (matches TerrainMeshBuilder build loop)
    for (let tileY = 0; tileY < this.size.y; tileY++) {
      for (let tileX = 0; tileX < this.size.x; tileX++) {
        const key = Tile.getKey(tileX, tileY);
        const tile = this.tilesByKey[key];
        if (!tile) continue;

        const instanceIndex = this.tileByInstanceIndex.length;
        this.tileByInstanceIndex.push(tile);
        this.instanceIndexByTileKey[tile.key] = instanceIndex;

        const center = tileCenter(this.size, tile); // { x, z }
        const m = LogicMeshBuilder.matrixFromPosition(center.x, 0, center.z);
        for (let i = 0; i < 16; i++) matrices.push(m[i]);
      }
    }

    return new Float32Array(matrices);
  }

  private createBaseHexMesh(): Mesh {
    const mesh = new Mesh("logicHexBase", this.scene);

    const hexagonRadiusWorldUnits = 1; // must match math.ts spacing (depth 1.5 ⇒ r=1)
    const vertexData = LogicMeshBuilder.createFlatHexVertexData(hexagonRadiusWorldUnits);
    vertexData.applyToMesh(mesh, true);

    const mat = new StandardMaterial("logicHexMaterial", this.scene);
    mat.diffuseColor = Color3.Black();
    mat.alpha = 0; // fully transparent by default (debug can change this)
    mat.disableLighting = true;
    mesh.material = mat;

    return mesh;
  }

  private static createFlatHexVertexData(radius: number): VertexData {
    const vd = new VertexData();

    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];

    const center = new Vector3(0, 0, 0);
    const vertices: Vector3[] = [];
    const pointyTopAngleOffset = Math.PI / 6; // 30° ensures width = sqrt(3)*r, depth = 2*r
    for (let sideIndex = 0; sideIndex < 6; sideIndex++) {
      const angleRadians = pointyTopAngleOffset + (Math.PI / 3) * sideIndex; // 60 degrees per side
      const x = Math.cos(angleRadians) * radius;
      const z = Math.sin(angleRadians) * radius;
      vertices.push(new Vector3(x, 0, z));
    }

    // Center fan triangulation
    positions.push(center.x, center.y, center.z);
    for (let i = 0; i < 6; i++) positions.push(vertices[i].x, vertices[i].y, vertices[i].z);
    for (let i = 0; i < 6; i++) {
      const a = 0; // center index
      const b = 1 + i;
      const c = 1 + ((i + 1) % 6);
      indices.push(a, b, c);
    }

    VertexData.ComputeNormals(positions, indices, normals);
    vd.positions = positions;
    vd.indices = indices;
    vd.normals = normals;
    return vd;
  }

  private static matrixFromPosition(x: number, y: number, z: number): Float32Array {
    // Column‑major 4x4 translation matrix
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1,
    ]);
  }

  private applyDebugVisibility(): void {
    if (!this.baseHexMesh) return;
    const mat = this.baseHexMesh.material as StandardMaterial | null;
    if (this.debugEnabled) {
      this.baseHexMesh.visibility = 1;
      if (mat) mat.alpha = this.debugVisibleAlpha;
    } else {
      this.baseHexMesh.visibility = 0;
      if (mat) mat.alpha = 0;
    }
  }

  private buildDetails(
    pick: PickingInfo | undefined,
    ev: PointerEvent | undefined,
  ): LogicPointerDetails | undefined {
    if (!this.debugEnabled || !this.baseHexMesh || !pick || pick.thinInstanceIndex === undefined)
      return undefined;
    return {
      mesh: this.baseHexMesh,
      pickInfo: pick,
      pointerEvent: ev ?? null,
      instanceIndex: pick.thinInstanceIndex,
      pointer: { x: this.scene.pointerX, y: this.scene.pointerY },
      tileKey: this.tileByInstanceIndex[pick.thinInstanceIndex]?.key ?? ("" as GameKey),
      tileCoords: this.tileByInstanceIndex[pick.thinInstanceIndex]
        ? { x: this.tileByInstanceIndex[pick.thinInstanceIndex].x, y: this.tileByInstanceIndex[pick.thinInstanceIndex].y }
        : undefined,
    };
  }
}

export default LogicMeshBuilder;

export type LogicPointerDetails = {
  mesh: Mesh;
  pickInfo: PickingInfo;
  pointerEvent: PointerEvent | null;
  instanceIndex: number;
  pointer: { x: number; y: number };
  tileKey: GameKey;
  tileCoords?: { x: number; y: number };
};
