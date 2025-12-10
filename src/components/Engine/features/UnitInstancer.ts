/*
TODO: UnitInstancer (GPU instancing for units)

Purpose
- Render unit visuals using GPU instancing.

Planned Public API (no implementation yet)
- constructor(scene: SceneLike, world: WorldLike)
  -> keep internal Record/Map of tile GameKey -> unit GameKey
- build(): Promise<this> | this
  -> loop world tiles and add all existing tile.unit (use addMany for perf)
  -> keep internal Record/Map of tile GameKey -> unit GameKey
- add(d: InstanceDescriptor): this
  -> descriptor.gameKey should reference the Unit GameKey
  -> use per-type base mesh; progress/health via descriptor.attrs or shader attributes
- addMany(ds: InstanceDescriptor[]): this
- remove(tileKey: GameKey): this
- removeMany(tileKeys: GameKey[]): this
- clear(): this
- setParent(node: TransformNode | null): this
- setMaterial(material: Material | null): this
- getMesh(): AbstractMesh | null
- reserve(n: number): this
- beginBatch(): this; endBatch(): this
- setEnabled(enabled: boolean): this
  - Toggle visibility of this instanced layer.
- update(changedTiles?: GameKey[]): this
- dispose(): void
*/
