/*
GridPicker (Babylon out-of-the-box picking)

Goal
- Emit GameKey for hover and click with the least custom math.

Approach
- Build one invisible hex base mesh and add a thin instance per tile.
- Enable thinInstanceEnablePicking and map thinInstanceIndex → GameKey.
- On pointer move/up, run scene.pick on this mesh and emit the mapped key.

Hex orientation & layout
- Project standard: POINTY-TOP hexes with odd-r (row-offset) layout.
- Spacing for pointy-top (r = distance center→vertex):
  - dx = sqrt(3) * r (column step)
  - dz = 1.5 * r      (row step)
- Row offset on X: x += 0.5 * dx for odd rows (y & 1)

Public API (minimal)
- constructor(scene: Scene, canvas: HTMLCanvasElement, world: { sizeX: number; sizeY: number }, opts?: { origin?: { x: number; z: number } })
- build(): this
- attach(): this
- detach(): this
- dispose(): void
- on(event: 'hover' | 'select' | 'down' | 'up', cb: (key: GameKey | null) => void): () => void
*/

import type { AbstractMesh } from "@babylonjs/core";
import { Matrix, MeshBuilder, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import type { GameKey } from "@/objects/game/_GameObject";
import { Tile } from "@/objects/game/Tile";

type Listener = (tileKey: GameKey | null) => void;

export type GridPickerOptions = {
  origin?: { x: number; z: number }; // world position of tile (0,0)
};

export class GridPicker {
  private readonly scene: Scene;
  private canvas: HTMLCanvasElement;
  private world: { sizeX: number; sizeY: number };
  private options: Required<GridPickerOptions>;
  private baseMesh: AbstractMesh | null = null;
  private indexToKey: GameKey[] = [];
  private root: TransformNode | null = null;
  private enabled = true;
  private lastHover: GameKey | null = null;
  private listeners: Record<"hover" | "select" | "down" | "up", Set<Listener>> = {
    hover: new Set(),
    select: new Set(),
    down: new Set(),
    up: new Set(),
  };

  constructor(
    scene: Scene,
    canvas: HTMLCanvasElement,
    world: { sizeX: number; sizeY: number },
    opts: GridPickerOptions = {},
  ) {
    this.scene = scene;
    this.canvas = canvas;
    this.world = world;
    this.options = {
      origin: opts.origin ?? { x: 0, z: 0 },
    };
  }

  build(): this {
    // Base pointy-top hex: a short cylinder with 6 tessellation
    const base = MeshBuilder.CreateCylinder(
      "hexBase",
      {
        height: 0.01,
        diameter: 2,
        tessellation: 6,
        updatable: false,
      },
      this.scene,
    );
    // Align orientation with visible grid: rotate 30° around Y for POINTY-TOP.
    base.rotation.y = Math.PI / 6;
    base.isPickable = true;
    base.isVisible = false; // invisible, picking still works
    base.thinInstanceEnablePicking = true;

    const root = new TransformNode("hexGridRoot", this.scene);
    base.parent = root;

    // Prepare transforms for each tile using pointy-top, odd-r layout (rows offset)
    const dx = Math.sqrt(3); // horizontal center spacing
    const dz = 1.5; // vertical spacing between rows
    const origin = this.options.origin;

    const tmp = Vector3.Zero();
    let idx = 0;
    for (let y = 0; y < this.world.sizeY; y++) {
      for (let x = 0; x < this.world.sizeX; x++) {
        const zx = origin.x + dx * (x + 0.5 * (y & 1));
        const zz = origin.z + dz * y;
        tmp.set(zx, 0, zz);
        const mat = Matrix.Translation(tmp.x, tmp.y, tmp.z);
        base.thinInstanceAdd(mat);
        this.indexToKey[idx++] = Tile.getKey(x, y) as GameKey;
      }
    }

    this.baseMesh = base;
    this.root = root;
    return this;
  }

  setEnabled(enabled: boolean): this {
    this.enabled = enabled;
    return this;
  }

  attach(): this {
    // Pointer move → hover
    this.canvas.addEventListener("pointermove", this.onMove);
    // Pointer down/up → down/select
    this.canvas.addEventListener("pointerdown", this.onDown);
    this.canvas.addEventListener("pointerup", this.onUp);
    return this;
  }

  detach(): this {
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointerup", this.onUp);
    return this;
  }

  dispose(): void {
    this.detach();
    this.indexToKey.length = 0;
    if (this.root) this.root.dispose();
    if (this.baseMesh) this.baseMesh.dispose(false, true);
    this.baseMesh = null;
    this.root = null;
  }

  on(event: "hover" | "select" | "down" | "up", cb: Listener): () => void {
    const set = this.listeners[event];
    set.add(cb);
    return () => set.delete(cb);
  }

  private pickKeyAtPointer(clientX: number, clientY: number): GameKey | null {
    if (!this.baseMesh || !this.enabled) return null;
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const pick = this.scene.pick(x, y, (m) => m === this.baseMesh);
    if (pick && pick.hit && typeof pick.thinInstanceIndex === "number") {
      return this.indexToKey[pick.thinInstanceIndex] ?? null;
    }
    return null;
  }

  private emit(event: keyof GridPicker["listeners"], key: GameKey | null): void {
    for (const cb of this.listeners[event]) cb(key);
  }

  private onMove = (e: PointerEvent) => {
    if (!this.enabled) return;
    const key = this.pickKeyAtPointer(e.clientX, e.clientY);
    if (key !== this.lastHover) {
      this.lastHover = key;
      this.emit("hover", key);
    }
  };

  private onDown = (e: PointerEvent) => {
    if (!this.enabled) return;
    const key = this.pickKeyAtPointer(e.clientX, e.clientY);
    this.emit("down", key);
  };

  private onUp = (e: PointerEvent) => {
    if (!this.enabled) return;
    const key = this.pickKeyAtPointer(e.clientX, e.clientY);
    this.emit("up", key);
    this.emit("select", key);
  };
}

export default GridPicker;
