import type { GameKey } from "@/objects/game/_GameObject";
import type { TypeKey } from "@/types/common";
import type {
  AbstractMesh,
  Color4,
  Material,
  Quaternion,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

/*
Shared instancing types for the Babylon renderer layer.

Notes
- Keys (tileKey/typeKey/gameKey) are kept as lightweight keys so the renderer
  does not depend on, nor retain, references to the game object store.
- Visual transforms and color use Babylon-native types to avoid re‑inventing
  math primitives and to interop directly with mesh/thin‑instance APIs.
*/

// Normalized descriptor for a single visual instance
export type InstanceDescriptor = {
  // Location of the instance in game space (typically a Tile key)
  tileKey: GameKey;

  // Which visual/type this instance represents (e.g., resource type, improvement type)
  typeKey: TypeKey;

  // Optional: concrete game entity key if the instance is tied to a GameObject (e.g., Construction)
  gameKey?: GameKey;

  // Babylon-native transform & color parameters (all optional; can be derived from tile when omitted)
  position?: Vector3; // world position
  rotation?: Vector3; // euler rotation (Y-up world)
  rotationQuaternion?: Quaternion; // alternative to rotation
  scaling?: Vector3; // non-uniform scaling
  color?: Color4; // per-instance color/tint/alpha

  // Bag for thin-instance custom attributes (shader data)
  attrs?: Record<string, number | number[]>;
};

// Base interface all instancers should aim to implement
export interface InstancerLike {
  // Lifecycle
  build(): Promise<this> | this;
  dispose(): void; // idempotent

  // Visibility
  setEnabled(enabled: boolean): this;

  // Scene wiring (Babylon-native types)
  setParent(node: TransformNode | null): this;
  setMaterial(material: Material | null): this;
  getMesh(): AbstractMesh | null;

  // Population & updates
  add(d: InstanceDescriptor): this;
  addMany(ds: InstanceDescriptor[]): this;
  remove(tileKey: GameKey): this;
  removeMany(tileKeys: GameKey[]): this;
  clear(): this;

  // Recompute transforms/colors for changed tiles (full refresh when omitted)
  update(changedTiles?: GameKey[]): this;

  // Capacity / stats
  getCount(): number;
  getCapacity(): number;
  reserve(capacity: number): this;

  // Performance knobs (thin instances)
  beginBatch(): this;
  endBatch(): this;
}
