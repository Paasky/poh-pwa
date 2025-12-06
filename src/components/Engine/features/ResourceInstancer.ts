/*
TODO: ResourceInstancer (GPU instancing for resources)

Purpose
- Render resource props (strategic/luxury/bonus) using GPU instancing.

Planned Public API (no implementation yet)
- constructor(scene: SceneLike, world: WorldLike)
- build(): Promise<this> | this
- setParent(node: TransformNode | null): this
- setMaterial(material: Material | null): this
- getMesh(): AbstractMesh | null
- add(d: InstanceDescriptor): this
- addMany(ds: InstanceDescriptor[]): this
- remove(tileKey: GameKey): this
- removeMany(tileKeys: GameKey[]): this
- clear(): this
- update(changedTiles?: GameKey[]): this
- setEnabled(enabled: boolean): void
- dispose(): void

Notes
- Resource variants selected by resource type; may also tint by abundance/ownership.
- Uses GameKey[] for tile updates and InstanceDescriptor inputs.
*/
