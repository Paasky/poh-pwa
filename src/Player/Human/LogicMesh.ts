// Imports are kept at the top of the file for clarity, tree‑shaking, and bundler friendliness.
// If we ever need code‑splitting or optional dependencies, we will use dynamic imports in a
// very targeted manner. This file does not require them.
import { tileCenter, wrapExclusive } from "@/helpers/math";
import type { Coords } from "@/helpers/mapTools";
import { Tile } from "@/Common/Models/Tile";
import type { GameKey } from "@/Common/Models/_GameModel";
import { EngineLayers } from "@/Player/Human/EngineStyles";
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
import { useSettingsStore } from "@/stores/settingsStore";
import { watch } from "vue";
import { useCurrentContext } from "@/composables/useCurrentContext";
import type { Unit } from "@/Common/Models/Unit";
import { MovementManager } from "@/Simulation/Movement/MovementManager";
import type { PohEngine } from "@/Player/Human/PohEngine";

/**
 * LogicMesh
 *
 * An invisible, thin‑instanced hex mesh used for picking and logical interactions.
 * Minimal inputs, clear API, Babylon 8 built‑ins first.
 */
export class LogicMesh {
  readonly engine: PohEngine;
  readonly scene: Scene;
  readonly size: Coords;
  readonly tilesByKey: Record<GameKey, Tile>;

  private readonly root: TransformNode;
  private readonly baseHexMesh: Mesh;

  private tileByInstanceIndex: Tile[] = [];
  private instanceIndexByTileKey: Record<GameKey, number> = {};

  private pointerObserver!: ReturnType<Scene["onPointerObservable"]["add"]>;
  private lastHoveredInstanceIndex: number | null = null;
  private debugVisibleAlpha: number = 0.75;

  constructor(engine: PohEngine, tilesByKey: Record<GameKey, Tile>) {
    this.engine = engine;
    this.scene = engine.scene;
    this.size = engine.size;
    this.tilesByKey = tilesByKey;
    this.root = new TransformNode("logicRoot", this.scene);

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
    this.baseHexMesh.freezeWorldMatrix();

    this.attachPointerObservers();

    const settings = useSettingsStore();
    this.baseHexMesh.visibility = settings.engineSettings.enableDebug ? 1 : 0;
    watch(
      () => settings.engineSettings.enableDebug,
      () => (this.baseHexMesh.visibility = useSettingsStore().engineSettings.enableDebug ? 1 : 0),
    );

    return this;
  }

  dispose(): void {
    if (this.pointerObserver) {
      this.scene.onPointerObservable.remove(this.pointerObserver);
    }

    this.tileByInstanceIndex = [];
    this.instanceIndexByTileKey = {} as Record<GameKey, number>;
    this.lastHoveredInstanceIndex = null;

    this.baseHexMesh.dispose(false, true);

    this.root.getChildren().forEach((n) => n.dispose());
  }

  // Internals
  private attachPointerObservers(): void {
    this.pointerObserver = this.scene.onPointerObservable.add((pointerInfo) => {
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
    // Not hovering over a tile + used to hover over a tile -> trigger exit handlers
    if (!pick || !pick.hit || pick.thinInstanceIndex === undefined) {
      if (this.lastHoveredInstanceIndex !== null) {
        this.lastHoveredInstanceIndex = null;
        this.onTileExit();
      }
      return;
    }

    const currentIndex = pick.thinInstanceIndex;

    // Hovering over a new tile -> trigger hover handlers
    if (this.lastHoveredInstanceIndex !== currentIndex) {
      const tile = this.tileByInstanceIndex[currentIndex];

      if (tile) {
        this.onTileHover(tile);
      } else if (this.lastHoveredInstanceIndex !== null) {
        // tile should never be null, but fallback to exit handlers in case it somehow is
        this.onTileExit();
      }

      this.lastHoveredInstanceIndex = currentIndex;
    }
  }

  private handleClick(
    pick: Nullable<import("@babylonjs/core").PickingInfo>,
    ev: PointerEvent,
  ): void {
    // Didn't click on anything -> do nothing
    if (!pick || !pick.hit || pick.thinInstanceIndex === undefined) return;
    const tile = this.tileByInstanceIndex[pick.thinInstanceIndex];
    if (!tile) return;

    const button = ev.button; // 0 left, 1 middle, 2 right

    if (button === 0) {
      this.onTileSelect(tile);
    }

    if (button === 2) {
      this.onTileAction(tile);
    }
  }

  private onTileSelect(tile: Tile): void {
    const current = useCurrentContext();
    // Tile has nothing to select -> clear selection
    if (!tile.selectable.length) {
      current.actionMode.value = undefined;
      current.tile.value = undefined;
      current.object.value = undefined;
      return;
    }

    // Tile is already selected
    if (current.tile.value?.key === tile.key) {
      // If something is selected -> select the next item
      if (current.object.value) {
        // Don't trust indexOf as it does an exact obj check
        for (const [i, item] of tile.selectable.entries()) {
          if (item.key === current.object.value!.key) {
            current.object.value =
              tile.selectable.value[wrapExclusive(i + 1, 0, tile.selectable.length)];
            return;
          }
        }
      }

      // Nothing is selected/selected item is not selectable anymore -> select the first item
      current.object.value = tile.selectable.value[0];
      return;
    }

    // Tile is not selected -> select the first item
    current.tile.value = tile;
    current.object.value = tile.selectable.value[0];
  }

  private onTileAction(tile: Tile): void {
    const current = useCurrentContext();
    // Check it's a unit
    const object = current.object;
    if (object?.class !== "unit") return;
    const unit = object as Unit;

    MovementManager.moveTo(unit, tile, undefined, this.engine);
  }

  // Fired on mouse moving on top
  private onTileHover(tile: Tile): void {
    useCurrentContext().hover.value = tile;
  }

  // Fired on mouse leaving (left canvas/left map tiles)
  private onTileExit(): void {
    useCurrentContext().hover.value = undefined;
  }

  ////////////////////////
  // Mesh Building
  ////////////////////////

  private buildInstanceMatricesAndMaps(): Float32Array {
    const matrices: number[] = [];

    // Stable ordering by y then x (matches TerrainMesh build loop)
    for (let tileY = 0; tileY < this.size.y; tileY++) {
      for (let tileX = 0; tileX < this.size.x; tileX++) {
        const key = Tile.getKey(tileX, tileY);
        const tile = this.tilesByKey[key];
        if (!tile) continue;

        const instanceIndex = this.tileByInstanceIndex.length;
        this.tileByInstanceIndex.push(tile);
        this.instanceIndexByTileKey[tile.key] = instanceIndex;

        const center = tileCenter(this.size, tile); // { x, z }
        const m = LogicMesh.matrixFromPosition(center.x, 0, center.z);
        for (let i = 0; i < 16; i++) matrices.push(m[i]);
      }
    }

    return new Float32Array(matrices);
  }

  private createBaseHexMesh(): Mesh {
    const mesh = new Mesh("logicHexBase", this.scene);

    const vertexData = LogicMesh.createFlatHexVertexData();
    vertexData.applyToMesh(mesh, true);

    const mat = new StandardMaterial("logicHexMaterial", this.scene);
    mat.diffuseColor = Color3.Purple();
    mat.alpha = this.debugVisibleAlpha;
    mat.disableLighting = true;
    mesh.material = mat;
    mesh.renderingGroupId = EngineLayers.terrain.group;

    return mesh;
  }

  private static createFlatHexVertexData(): VertexData {
    const vd = new VertexData();

    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];

    const center = new Vector3(0, 0, 0);
    const vertices: Vector3[] = [];
    const pointyTopAngleOffset = Math.PI / 6; // 30° ensures width = sqrt(3)*r, depth = 2*r
    for (let sideIndex = 0; sideIndex < 6; sideIndex++) {
      const angleRadians = pointyTopAngleOffset + (Math.PI / 3) * sideIndex; // 60 degrees per side
      const x = Math.cos(angleRadians);
      const z = Math.sin(angleRadians);
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
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
  }
}

export default LogicMesh;
