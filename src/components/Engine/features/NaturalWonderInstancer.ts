/*
TODO: NaturalWonderInstancer (GPU instancing for natural wonders)

Purpose
- Render natural wonders using instanced meshes or unique meshes per wonder type.

Planned Public API (no implementation yet)
- constructor(scene: SceneLike, world: WorldLike)
- build(): Promise<this> | this
- setParent(node: TransformNode | null): this
- setMaterial(material: Material | null): this
- getMesh(): AbstractMesh | null
- add(d: InstanceDescriptor): this // may create dedicated meshes for unique wonders
- addMany(ds: InstanceDescriptor[]): this
- remove(tileKey: GameKey): this
- removeMany(tileKeys: GameKey[]): this
- clear(): this
- update(changedTiles?: GameKey[]): void
- setEnabled(enabled: boolean): void
- dispose(): void

Notes
- Some wonders may require unique meshes/materials; fall back to instancing when possible.
- Uses GameKey[] for updates and InstanceDescriptor inputs.
*/
