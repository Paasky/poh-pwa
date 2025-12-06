/*
TODO: FeatureInstancer (GPU instancing for props)

Purpose
- Manage GPU instanced meshes for generic map features (forests, hills decals, etc.).
- Decouple feature visuals from game logic; only reads from WorldLike/Tile data.

Planned Public API (no implementation yet)
- constructor(scene: SceneLike, world: WorldLike, options?: { capacity?: number })
- build(): Promise<this> | this
  - Creates base mesh + instanced buffers; populates from world tiles.
- setParent(node: TransformNode | null): this
- setMaterial(material: Material | null): this
- getMesh(): AbstractMesh | null
- add(d: InstanceDescriptor): this
- addMany(ds: InstanceDescriptor[]): this
- remove(tileKey: GameKey): this
- removeMany(tileKeys: GameKey[]): this
- clear(): this
- update(changedTiles?: GameKey[]): this
  - Rebuilds instance transforms/colors only for affected tiles.
- getCount(): number
- getCapacity(): number
- reserve(n: number): this
- beginBatch(): this; endBatch(): this
- setEnabled(enabled: boolean): this
  - Toggle visibility of this instanced layer.
- dispose(): void
  - Disposes mesh buffers and materials.

Notes
- Specific subclasses (Resource/Improvement/Construction/etc.) will filter tiles by feature kind.
- Uses Babylon types for transforms/colors; keys are GameKey/TypeKey per InstanceDescriptor.
*/
