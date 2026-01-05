/*
TODO: PollutionInstancer (GPU instancing for pollution overlays)

Purpose
- Render pollution visuals (smog, fallout, contamination decals) using GPU instancing or decals.

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
- update(changedTiles?: GameKey[]): void
- setEnabled(enabled: boolean): void
- dispose(): void

Notes
- Visual encoding may use color/intensity by pollution severity/type.
- Uses GameKey[] for tile updates and InstanceDescriptor inputs.
*/
