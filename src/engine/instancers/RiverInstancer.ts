/*
TODO: RiverInstancer (GPU instancing or ribbon meshes for rivers)

Purpose
- Render river tiles edges using instancing or dynamic ribbons.

Planned Public API (no implementation yet)
- constructor(scene: SceneLike, world: WorldLike)
- build(): Promise<this> | this
- setParent(node: TransformNode | null): this
- setMaterial(material: Material | null): this
- getMesh(): AbstractMesh | null
- add(d: InstanceDescriptor  // allow edgeKey in descriptor via extension
-   ): this
- addMany(ds: InstanceDescriptor[]): this
- remove(tileKey: GameKey): this
- removeMany(tileKeys: GameKey[]): this
- clear(): this
- update(changedTiles?: GameKey[]): void
- setEnabled(enabled: boolean): void
- dispose(): void
*/
