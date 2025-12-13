import type { Scene } from "@babylonjs/core";
import { Camera, Constants, Effect, PostProcess, RawTexture, RenderTargetTexture, } from "@babylonjs/core";
import { getWorldDepth, getWorldMinX, getWorldMinZ, getWorldWidth, hexDepth, hexWidth, } from "@/helpers/math";
import type { Coords } from "@/helpers/mapTools";
import type { Tile } from "@/objects/game/Tile";
import type { GameKey } from "@/objects/game/_GameObject";

// === Fog of War tunables (kept internal; not user-adjustable) ===
// How much to dim explored-but-not-currently-visible tiles (0..1, multiplier)
const FOW_EXPLORED_DIM = 0.45;
// Alpha to blend unknown areas toward black (0..1)
// QoL: set to 0.75 so player can orient on the map
const FOW_UNKNOWN_ALPHA = 0.75;

// Converts logic visibility to a compact RGBA8 mask (no rendering hookup yet)
export class FogOfWar {
  // Inputs / configuration
  readonly scene: Scene;
  readonly size: Coords;
  readonly tilesByKey: Record<string, Tile>;

  // Logical state
  knownKeys: Set<GameKey>;
  visibleKeys: Set<GameKey>;

  // CPU-side buffer (RGBA8): R=known, G=visible, B=0, A=255
  data: Uint8Array;

  // Map tile key → linear index into data
  indexByKey: Map<GameKey, number> = new Map();

  // Enabled toggle for future rendering pipeline
  enabled = true;

  // GPU resources owned by this component
  private texture: RawTexture;
  private post: PostProcess;
  // Cached depth texture (created once per camera)
  private depthMap!: RenderTargetTexture;

  constructor(
    scene: Scene,
    size: Coords,
    tilesByKey: Record<string, Tile>,
    knownTileKeys: GameKey[],
    visibleTileKeys: GameKey[],
  ) {
    // Required fields initialized in constructor (no lazy nulls)
    this.scene = scene;
    this.size = size;
    this.tilesByKey = tilesByKey;

    this.knownKeys = new Set(knownTileKeys);
    this.visibleKeys = new Set(visibleTileKeys);

    // Build index map using Tile.x/y and its GameKey
    const w = this.size.x;
    const idx = (x: number, y: number) => x + y * w;
    for (const key in tilesByKey) {
      const t = tilesByKey[key];
      // Tile exposes a stable GameKey via t.key
      this.indexByKey.set(t.key as GameKey, idx(t.x, t.y));
    }

    // Allocate buffer and compute initial state
    this.data = new Uint8Array(this.size.x * this.size.y * 4);
    this.rebuildFullBuffer();

    // Build GPU texture from buffer (nearest sampling to avoid tile bleeding)
    this.texture = RawTexture.CreateRGBATexture(
      this.data,
      this.size.x,
      this.size.y,
      this.scene,
      false,
      false,
      Constants.TEXTURE_NEAREST_SAMPLINGMODE,
    );

    // Create and attach the fog post-process
    this.post = this.createFogPostProcess();
  }

  // Replace both sets from visibility, with optional subset update
  updateFromVisibility(visibleTileKeys: Iterable<GameKey>, changedTiles?: GameKey[]): void {
    this.visibleKeys = new Set(visibleTileKeys);
    if (changedTiles && changedTiles.length > 0) {
      this.updateSubset(changedTiles);
    } else {
      this.rebuildFullBuffer();
    }
    this.texture.update(this.data);
  }

  // API: reveal tiles permanently; returns this
  addKnownTiles(tiles: Tile[]): FogOfWar {
    const changed: GameKey[] = [];
    for (const t of tiles) {
      const key = t.key as GameKey;
      if (!this.knownKeys.has(key)) {
        this.knownKeys.add(key);
        changed.push(key);
      }
    }
    if (changed.length) {
      this.updateSubset(changed);
      this.texture.update(this.data);
    }
    return this;
  }

  // API: replace current visible set; compute diff for minimal writes
  setVisibleTiles(tiles: Tile[]): void {
    const next = new Set<GameKey>();
    for (const t of tiles) next.add(t.key as GameKey);

    const changed: GameKey[] = [];
    // Removed
    for (const k of this.visibleKeys) if (!next.has(k)) changed.push(k);
    // Added
    for (const k of next) if (!this.visibleKeys.has(k)) changed.push(k);

    this.visibleKeys = next;
    if (changed.length) {
      this.updateSubset(changed);
      this.texture.update(this.data);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    // BabylonJS v8 PostProcess uses a boolean property `enabled` (no setEnabled method)
    this.post.enabled = enabled;
  }

  dispose(): void {
    // Clear large buffers/maps deterministically
    this.indexByKey.clear();
    this.data = new Uint8Array(0);
    this.post.dispose();
    this.texture.dispose();
  }

  // --- internals ---
  private rebuildFullBuffer(): void {
    const w = this.size.x | 0;
    const h = this.size.y | 0;
    const N = w * h;
    for (let i = 0; i < N; i++) {
      const base = i * 4;
      this.data[base + 0] = 0; // R known
      this.data[base + 1] = 0; // G visible
      this.data[base + 2] = 0; // B (unused)
      this.data[base + 3] = 255; // A (unused)
    }
    // Write known and visible flags
    for (const k of this.knownKeys) {
      const i = this.indexByKey.get(k);
      if (i == null) throw new Error(`FogOfWar: missing index for known key ${String(k)}`);
      this.writeRGForIndex(i, true, this.visibleKeys.has(k));
    }
    for (const k of this.visibleKeys) {
      const i = this.indexByKey.get(k);
      if (i == null) throw new Error(`FogOfWar: missing index for visible key ${String(k)}`);
      this.writeRGForIndex(i, this.knownKeys.has(k), true);
    }
  }

  private updateSubset(keys: GameKey[]): void {
    for (const k of keys) {
      const i = this.indexByKey.get(k);
      if (i == null) throw new Error(`FogOfWar: missing index for changed key ${String(k)}`);
      const isKnown = this.knownKeys.has(k);
      const isVisible = this.visibleKeys.has(k);
      this.writeRGForIndex(i, isKnown, isVisible);
    }
  }

  private writeRGForIndex(i: number, known: boolean, visible: boolean): void {
    const base = i * 4;
    this.data[base + 0] = known ? 255 : 0;
    this.data[base + 1] = visible ? 255 : 0;
    // B and A were set in full rebuild
  }

  private createFogPostProcess(): PostProcess {
    if (!this.scene.activeCamera) throw new Error("FogOfWar: scene has no active camera");

    // Register shaders once
    if (!Effect.ShadersStore["fogOfWarPPVertexShader"]) {
      Effect.ShadersStore["fogOfWarPPVertexShader"] = `
        precision highp float;
        attribute vec2 position;
        varying vec2 vUV;
        void main(void){
          vUV = (position + 1.0) * 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;
    }
    if (!Effect.ShadersStore["fogOfWarPPFragmentShader"]) {
      Effect.ShadersStore["fogOfWarPPFragmentShader"] = `
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
        uniform vec2 gridSize; // sizeX, sizeY
        uniform float hexWidth;
        uniform float hexDepth;
        uniform float useOrthoWorldUV; // 1.0 for ortho/minimap path, 0.0 for perspective

        vec3 viewPosFromDepth(vec2 uv, float depth){
          float z = depth * 2.0 - 1.0; // ndc z
          vec4 clip = vec4(uv*2.0-1.0, z, 1.0);
          vec4 view = invProj * clip; view /= view.w;
          return view.xyz;
        }

        void main(){
          vec4 base = texture2D(textureSampler, vUV);
          vec3 worldPos;
          if (useOrthoWorldUV > 0.5) {
            // Ortho/minimap: derive world XZ directly from screen UV and world bounds
            worldPos.x = worldXZBounds.x + vUV.x * worldXZBounds.z;
            worldPos.z = worldXZBounds.y + vUV.y * worldXZBounds.w;
          } else {
            // Perspective: reconstruct world XZ by intersecting view ray with ground plane (y=0)
            // Build near/far points in view space from NDC
            vec4 ndcNear = vec4(vUV * 2.0 - 1.0, 0.0, 1.0);
            vec4 ndcFar  = vec4(vUV * 2.0 - 1.0, 1.0, 1.0);
            vec4 viewNear4 = invProj * ndcNear; viewNear4 /= viewNear4.w;
            vec4 viewFar4  = invProj * ndcFar;  viewFar4  /= viewFar4.w;
            vec3 worldNear = (invView * viewNear4).xyz;
            vec3 worldFar  = (invView * viewFar4).xyz;
            vec3 dir = normalize(worldFar - worldNear);
            // Intersect with plane y=0: worldNear.y + t*dir.y = 0 => t = -worldNear.y/dir.y
            float denom = abs(dir.y) < 1e-5 ? 1e-5 : dir.y;
            float t = -worldNear.y / denom;
            worldPos = worldNear + dir * t;
          }

          // Convert world XZ to odd-r hex tile indices via axial (q,r) rounding
          float minX = worldXZBounds.x;
          float minZ = worldXZBounds.y;
          float sizeX = gridSize.x;
          float sizeY = gridSize.y;

          float xw = worldPos.x - minX;
          float zw = worldPos.z - minZ;

          // Axial from world (pointy-top). Assumes hexWidth = sqrt(3) and hexDepth = 1.5 per tile
          float q = (hexWidth / 3.0) * xw - (1.0 / 3.0) * zw;
          float r = (2.0 / 3.0) * zw;

          // Cube coords
          float cx = q;
          float cz = r;
          float cy = -cx - cz;

          // Round to nearest cube
          float rx = floor(cx + 0.5);
          float ry = floor(cy + 0.5);
          float rz = floor(cz + 0.5);
          float dx = abs(rx - cx);
          float dy = abs(ry - cy);
          float dz = abs(rz - cz);
          if (dx > dy && dx > dz) {
            rx = -ry - rz;
          } else if (dy > dz) {
            ry = -rx - rz;
          } else {
            rz = -rx - ry;
          }

          // Offset (odd-r) conversion
          float row = rz;
          if (row < 0.0) row = 0.0; else if (row > (sizeY - 1.0)) row = sizeY - 1.0;
          float parity = mod(row, 2.0);
          float col = rx + floor((row - parity) * 0.5);

          // Wrap X
          float gx = mod(col, sizeX);
          if (gx < 0.0) gx += sizeX;

          // Sample mask at the tile center to avoid boundary jitter
          vec2 muv = vec2((gx + 0.5) / sizeX, (row + 0.5) / sizeY);

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
      `;
    }

    const pp = new PostProcess(
      "fogOfWarPP",
      "fogOfWarPP",
      [
        "invView",
        "invProj",
        "worldXZBounds",
        "exploredDim",
        "unknownAlpha",
        "gridSize",
        "hexWidth",
        "hexDepth",
        "useOrthoWorldUV",
      ],
      ["maskTex", "depthSampler"],
      1.0,
      this.scene.activeCamera,
      Constants.TEXTURE_NEAREST_SAMPLINGMODE,
      this.scene.getEngine(),
      false,
    );
    // Compose after prior passes
    pp.autoClear = false;

    const worldWidth = getWorldWidth(this.size.x);
    const worldDepth = getWorldDepth(this.size.y);
    const minX = getWorldMinX(worldWidth);
    const minZ = getWorldMinZ(worldDepth);

    // Create and cache the depth renderer once (per current active camera)
    const depthRenderer = this.scene.enableDepthRenderer(this.scene.activeCamera!, true);
    this.depthMap = depthRenderer.getDepthMap();

    pp.onApply = (effect) => {
      effect.setTexture("maskTex", this.texture);
      effect.setTexture("depthSampler", this.depthMap);
      effect.setMatrix("invView", this.scene.getViewMatrix().invert());
      effect.setMatrix("invProj", this.scene.getProjectionMatrix().invert());
      effect.setFloat4("worldXZBounds", minX, minZ, worldWidth, worldDepth);
      effect.setFloat("exploredDim", FOW_EXPLORED_DIM);
      effect.setFloat("unknownAlpha", FOW_UNKNOWN_ALPHA);
      effect.setFloat2("gridSize", this.size.x, this.size.y);
      effect.setFloat("hexWidth", hexWidth);
      effect.setFloat("hexDepth", hexDepth);
      const isOrtho = this.scene.activeCamera?.mode === Camera.ORTHOGRAPHIC_CAMERA;
      effect.setFloat("useOrthoWorldUV", isOrtho ? 1.0 : 0.0);
    };

    return pp;
  }
}
