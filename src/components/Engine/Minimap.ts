/*
TODO: Minimap renderer (orthographic projection)

Purpose
- Render a small orthographic/top‑down view of the world for UI purposes.
- Optionally share buffers/textures with the main scene or render to a mini RT texture.

Planned Public API (no implementation yet)
- constructor(scene: SceneLike, world: WorldLike, options?: { size?: number })
- build(container?: HTMLElement): void
  - Creates the minimap camera, render target, and quad/DOM target.
- setFogTexture(tex: TextureLike | null): void
  - Use same fog mask as the main view.
- update(changedTiles?: GameKey[]): void
  - Re-renders only updated regions when possible.
- dispose(): void
  - Cleans all resources.

Notes
- Keep separate from UI component (MiniMap.vue) which only hosts the output.
- Consider single draw of terrain colors for performance.
*/
