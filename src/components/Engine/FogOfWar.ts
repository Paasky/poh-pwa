import type { Scene } from '@babylonjs/core'
import { Constants, Effect, PostProcess, RawTexture } from '@babylonjs/core'
import { getWorldDepth, getWorldMinX, getWorldMinZ, getWorldWidth } from '@/helpers/math'
import type { Coords } from '@/helpers/mapTools'
import type { Tile } from '@/objects/game/Tile'
import type { GameKey } from '@/objects/game/_GameObject'

// Converts logic visibility to a compact RGBA8 mask (no rendering hookup yet)
export class FogOfWar {
  // Inputs / configuration
  readonly scene: Scene
  readonly size: Coords
  readonly tilesByKey: Record<string, Tile>

  // Logical state
  knownKeys: Set<GameKey>
  visibleKeys: Set<GameKey>

  // CPU-side buffer (RGBA8): R=known, G=visible, B=0, A=255
  data: Uint8Array

  // Map tile key → linear index into data
  indexByKey: Map<GameKey, number> = new Map()

  // Enabled toggle for future rendering pipeline
  enabled = true

  // GPU resources owned by this component
  private texture: RawTexture
  private post: PostProcess

  constructor (
    scene: Scene,
    size: Coords,
    tilesByKey: Record<string, Tile>,
    knownTileKeys: GameKey[],
    visibleTileKeys: GameKey[],
  ) {
    // Required fields initialized in constructor (no lazy nulls)
    this.scene = scene
    this.size = size
    this.tilesByKey = tilesByKey

    this.knownKeys = new Set(knownTileKeys)
    this.visibleKeys = new Set(visibleTileKeys)

    // Build index map using Tile.x/y and its GameKey
    const w = this.size.x
    const idx = (x: number, y: number) => x + y * w
    for (const key in tilesByKey) {
      const t = tilesByKey[key]
      // Tile exposes a stable GameKey via t.key
      this.indexByKey.set(t.key as GameKey, idx(t.x, t.y))
    }

    // Allocate buffer and compute initial state
    this.data = new Uint8Array(this.size.x * this.size.y * 4)
    this.rebuildFullBuffer()

    // Build GPU texture from buffer (nearest sampling to avoid tile bleeding)
    this.texture = RawTexture.CreateRGBATexture(
      this.data,
      this.size.x,
      this.size.y,
      this.scene,
      false,
      false,
      Constants.TEXTURE_NEAREST_SAMPLINGMODE,
    )

    // Create and attach the fog post-process
    this.post = this.createFogPostProcess()
  }

  // Replace both sets from visibility, with optional subset update
  updateFromVisibility (visibleTileKeys: Iterable<GameKey>, changedTiles?: GameKey[]): void {
    this.visibleKeys = new Set(visibleTileKeys)
    if (changedTiles && changedTiles.length > 0) {
      this.updateSubset(changedTiles)
    } else {
      this.rebuildFullBuffer()
    }
    this.texture.update(this.data)
  }

  // API: reveal tiles permanently; returns this
  addKnownTiles (tiles: Tile[]): FogOfWar {
    const changed: GameKey[] = []
    for (const t of tiles) {
      const key = (t as any).key as GameKey
      if (!this.knownKeys.has(key)) {
        this.knownKeys.add(key)
        changed.push(key)
      }
    }
    if (changed.length) {
      this.updateSubset(changed)
      this.texture.update(this.data)
    }
    return this
  }

  // API: replace current visible set; compute diff for minimal writes
  setVisibleTiles (tiles: Tile[]): void {
    const next = new Set<GameKey>()
    for (const t of tiles) next.add((t as any).key as GameKey)

    const changed: GameKey[] = []
    // Removed
    for (const k of this.visibleKeys) if (!next.has(k)) changed.push(k)
    // Added
    for (const k of next) if (!this.visibleKeys.has(k)) changed.push(k)

    this.visibleKeys = next
    if (changed.length) {
      this.updateSubset(changed)
      this.texture.update(this.data)
    }
  }

  setEnabled (enabled: boolean): void {
    this.enabled = enabled
    this.post.setEnabled(enabled)
  }

  dispose (): void {
    // Clear large buffers/maps deterministically
    this.indexByKey.clear()
    this.data = new Uint8Array(0)
    this.post.dispose()
    this.texture.dispose()
  }

  // --- internals ---
  private rebuildFullBuffer (): void {
    const w = this.size.x | 0
    const h = this.size.y | 0
    const N = w * h
    for (let i = 0; i < N; i++) {
      const base = i * 4
      this.data[base + 0] = 0 // R known
      this.data[base + 1] = 0 // G visible
      this.data[base + 2] = 0 // B (unused)
      this.data[base + 3] = 255 // A (unused)
    }
    // Write known and visible flags
    for (const k of this.knownKeys) {
      const i = this.indexByKey.get(k)
      if (i == null) throw new Error(`FogOfWar: missing index for known key ${String(k)}`)
      this.writeRGForIndex(i, true, this.visibleKeys.has(k))
    }
    for (const k of this.visibleKeys) {
      const i = this.indexByKey.get(k)
      if (i == null) throw new Error(`FogOfWar: missing index for visible key ${String(k)}`)
      this.writeRGForIndex(i, this.knownKeys.has(k), true)
    }
  }

  private updateSubset (keys: GameKey[]): void {
    for (const k of keys) {
      const i = this.indexByKey.get(k)
      if (i == null) throw new Error(`FogOfWar: missing index for changed key ${String(k)}`)
      const isKnown = this.knownKeys.has(k)
      const isVisible = this.visibleKeys.has(k)
      this.writeRGForIndex(i, isKnown, isVisible)
    }
  }

  private writeRGForIndex (i: number, known: boolean, visible: boolean): void {
    const base = i * 4
    this.data[base + 0] = known ? 255 : 0
    this.data[base + 1] = visible ? 255 : 0
    // B and A were set in full rebuild
  }

  private createFogPostProcess (): PostProcess {
    if (!this.scene.activeCamera) throw new Error('FogOfWar: scene has no active camera')

    // Register shaders once
    if (!Effect.ShadersStore['fogOfWarPPVertexShader']) {
      Effect.ShadersStore['fogOfWarPPVertexShader'] = `
        precision highp float;
        attribute vec2 position;
        varying vec2 vUV;
        void main(void){
          vUV = (position + 1.0) * 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `
    }
    if (!Effect.ShadersStore['fogOfWarPPFragmentShader']) {
      Effect.ShadersStore['fogOfWarPPFragmentShader'] = `
        precision highp float;
        varying vec2 vUV;
        uniform sampler2D textureSampler; // scene color
        uniform sampler2D depthSampler;   // scene depth
        uniform sampler2D maskTex;        // RG mask (R=known, G=visible)
        uniform mat4 invView;
        uniform mat4 invProj;
        uniform vec4 worldXZBounds; // minX, minZ, width, depth
        uniform float exploredDim;
        uniform float unknownAlpha;

        vec3 viewPosFromDepth(vec2 uv, float depth){
          float z = depth * 2.0 - 1.0; // ndc z
          vec4 clip = vec4(uv*2.0-1.0, z, 1.0);
          vec4 view = invProj * clip; view /= view.w;
          return view.xyz;
        }

        void main(){
          vec4 base = texture2D(textureSampler, vUV);
          float depth = texture2D(depthSampler, vUV).r;
          vec3 viewPos = viewPosFromDepth(vUV, depth);
          vec4 worldPos4 = invView * vec4(viewPos, 1.0);
          vec3 worldPos = worldPos4.xyz;

          // Map world XZ -> mask UV in [0,1]
          float u = (worldPos.x - worldXZBounds.x) / worldXZBounds.z;
          float v = (worldPos.z - worldXZBounds.y) / worldXZBounds.w;
          vec2 muv = vec2(u, v);

          vec4 m = texture2D(maskTex, muv);
          float known = m.r; // 0..1
          float visible = m.g; // 0..1

          vec3 color = base.rgb;
          float fogA = 0.0;
          if (known < 0.5) {
            fogA = unknownAlpha;
          } else if (visible < 0.5) {
            color *= exploredDim;
          }
          vec3 outRgb = mix(color, vec3(0.0), fogA);
          gl_FragColor = vec4(outRgb, 1.0);
        }
      `
    }

    const pp = new PostProcess(
      'fogOfWarPP',
      'fogOfWarPP',
      ['invView', 'invProj', 'worldXZBounds', 'exploredDim', 'unknownAlpha'],
      ['maskTex', 'depthSampler'],
      1.0,
      this.scene.activeCamera,
      Constants.TEXTURE_NEAREST_SAMPLINGMODE,
      this.scene.getEngine(),
      false,
    )

    const worldWidth = getWorldWidth(this.size.x)
    const worldDepth = getWorldDepth(this.size.y)
    const minX = getWorldMinX(worldWidth)
    const minZ = getWorldMinZ(worldDepth)

    pp.onApply = (effect) => {
      const cam = this.scene.activeCamera!
      const depthRenderer = this.scene.enableDepthRenderer(cam, true)
      effect.setTexture('maskTex', this.texture)
      effect.setTexture('depthSampler', depthRenderer.getDepthMap())
      effect.setMatrix('invView', this.scene.getViewMatrix().invert())
      effect.setMatrix('invProj', this.scene.getProjectionMatrix().invert())
      effect.setFloat4('worldXZBounds', minX, minZ, worldWidth, worldDepth)
      effect.setFloat('exploredDim', 0.45)
      effect.setFloat('unknownAlpha', 1.0)
    }

    return pp
  }
}
