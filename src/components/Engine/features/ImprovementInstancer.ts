/*
TODO: ImprovementInstancer (GPU instancing for tile improvements)

Purpose
- Render tile improvements (farms, mines, roads) using GPU instancing.

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
- Select variant meshes based on improvement type and level.
- Uses GameKey[] for tile updates and InstanceDescriptor inputs.
*/
