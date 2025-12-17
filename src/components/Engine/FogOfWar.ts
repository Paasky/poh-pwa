import type { Scene } from "@babylonjs/core";
import {
  ArcRotateCamera,
  Effect,
  Matrix,
  PostProcess,
  RawTexture,
  Texture,
  Vector2,
  Vector3,
  Vector4,
} from "@babylonjs/core";
import { getWorldDepth, getWorldMinX, getWorldMinZ, getWorldWidth } from "@/helpers/math";
import type { Coords } from "@/helpers/mapTools";
import { Tile } from "@/objects/game/Tile";
import type { GameKey } from "@/objects/game/_GameObject";

export class FogOfWar {
  // === Fog of War tunables (kept internal; not user-adjustable) ===
  // How much to dim explored-but-not-currently-visible tiles (0..1, multiplier)
  exploredDim = 0.33;
  // Alpha to blend unknown areas toward black (0..1)
  // Dev QoL: set to 0.75 so player can orient on the map
  unknownDim = 0.75;

  // Inputs / configuration
  readonly scene: Scene;
  readonly size: Coords;
  readonly tilesByKey: Record<string, Tile>;
  readonly camera: ArcRotateCamera;

  // Logical state
  knownKeys: Set<GameKey>;
  visibleKeys: Set<GameKey>;

  // GPU/CPU resources
  private maskBuffer!: Uint8Array;
  private maskTexture!: RawTexture;
  private postProcess!: PostProcess;

  private _initialized = false;

  constructor(
    size: Coords,
    scene: Scene,
    camera: ArcRotateCamera,
    tilesByKey: Record<string, Tile>,
    knownTileKeys: GameKey[],
    visibleTileKeys: GameKey[],
  ) {
    // Required fields initialized in constructor (no lazy nulls)
    this.scene = scene;
    this.size = size;
    this.tilesByKey = tilesByKey;
    this.camera = camera;

    this.knownKeys = new Set(knownTileKeys);
    this.visibleKeys = new Set(visibleTileKeys);
    console.log(this.knownKeys, this.visibleKeys);

    // init resources and run once
    this.initResources();
    this.process();
  }

  addAndSetTiles(addKnownKeys: GameKey[], setVisibleKeys?: GameKey[]): this {
    addKnownKeys.forEach((k) => this.knownKeys.add(k));
    if (setVisibleKeys) this.visibleKeys = new Set(setVisibleKeys);
    this.process();

    return this;
  }

  dispose(): void {
    // dispose of all data created during my lifespan
    if (this.postProcess) this.postProcess.dispose();
    if (this.maskTexture) this.maskTexture.dispose();
    // buffer is GC-managed
  }

  private process(): this {
    // Build or update RG mask from known/visible sets
    if (!this._initialized) this.initResources();
    const w = this.size.x;
    const h = this.size.y;
    const buf = this.maskBuffer;
    let i = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const key = Tile.getKey(x, y);
        const known = this.knownKeys.has(key as GameKey) ? 255 : 0;
        const visible = this.visibleKeys.has(key as GameKey) ? 255 : 0;
        buf[i++] = known; // R
        buf[i++] = visible; // G
        buf[i++] = 0; // B
        buf[i++] = 255; // A
      }
    }
    this.maskTexture.update(buf);
    return this;
  }

  private initResources(): void {
    if (this._initialized) return;
    const w = this.size.x;
    const h = this.size.y;
    this.maskBuffer = new Uint8Array(w * h * 4);
    this.maskTexture = RawTexture.CreateRGBATexture(
      this.maskBuffer,
      w,
      h,
      this.scene.getEngine(),
      false,
      false,
      Texture.NEAREST_SAMPLINGMODE,
    );
    this.maskTexture.wrapU = Texture.WRAP_ADDRESSMODE; // wrap X
    this.maskTexture.wrapV = Texture.CLAMP_ADDRESSMODE; // clamp Y

    // Register shader once
    this.registerShader();

    // Create the projector post-process and wire uniforms
    this.createPostProcess();

    this._initialized = true;
  }

  private createPostProcess(): void {
    const camera = this.camera;
    const size = this.size;
    const worldWidth = getWorldWidth(size.x);
    const worldDepth = getWorldDepth(size.y);
    const minX = getWorldMinX(worldWidth);
    const minZ = getWorldMinZ(worldDepth);

    this.postProcess = new PostProcess(
      "FoW",
      "fowProjector",
      [
        "invViewProjection",
        "cameraPosition",
        "worldXZBounds",
        "gridSize",
        "exploredDim",
        "unknownAlpha",
      ],
      ["maskTex"],
      1.0,
      camera,
    );

    this.postProcess.onApply = (effect) => {
      const view = camera.getViewMatrix();
      const proj = camera.getProjectionMatrix();
      const invVP = Matrix.Invert(view.multiply(proj));
      effect.setMatrix("invViewProjection", invVP);
      effect.setVector3("cameraPosition", camera.position as Vector3);
      effect.setVector4("worldXZBounds", new Vector4(minX, minZ, worldWidth, worldDepth));
      effect.setVector2("gridSize", new Vector2(size.x, size.y));
      effect.setFloat("exploredDim", this.exploredDim);
      effect.setFloat("unknownAlpha", this.unknownDim);
      effect.setTexture("maskTex", this.maskTexture);
    };
  }

  private registerShader(): void {
    if (Effect.ShadersStore["fowProjectorFragmentShader"]) return; // once
    Effect.ShadersStore["fowProjectorFragmentShader"] = `
      #ifdef GL_ES
      precision highp float;
      #endif

      varying vec2 vUV;
      uniform sampler2D textureSampler; // scene color
      uniform sampler2D maskTex; // RG mask

      uniform mat4 invViewProjection;
      uniform vec3 cameraPosition;
      uniform vec4 worldXZBounds; // (minX, minZ, worldWidth, worldDepth)
      uniform vec2 gridSize; // (sizeX, sizeY)
      uniform float exploredDim;
      uniform float unknownAlpha;

      vec3 worldRayFromUV(vec2 uv) {
        vec2 ndc = uv * 2.0 - 1.0;
        vec4 nearH = invViewProjection * vec4(ndc, 0.0, 1.0);
        vec4 farH  = invViewProjection * vec4(ndc, 1.0, 1.0);
        vec3 nearW = nearH.xyz / nearH.w;
        vec3 farW  = farH.xyz / farH.w;
        vec3 dir = normalize(farW - cameraPosition);
        return dir;
      }

      vec2 intersectXZ(vec3 rayDir) {
        float denom = abs(rayDir.y) < 1e-5 ? (rayDir.y < 0.0 ? -1e-5 : 1e-5) : rayDir.y;
        float t = -cameraPosition.y / denom;
        vec3 p = cameraPosition + rayDir * t;
        return p.xz;
      }

      // Convert world XZ -> tile index (odd-r pointy-top). Matches TS worldToTileIndices.
      ivec2 worldXZToTile(vec2 xz, vec4 bounds, vec2 grid) {
        float minX = bounds.x; float minZ = bounds.y;
        // Flip Z-axis: game world increases "south" with decreasing world Z, so measure from maxZ
        // Correct constant offset: shift south by one worldDepth (negative sign for flipped-Z)
        float xw = xz.x - minX; float zw = (minZ + bounds.w) - xz.y - bounds.w;
        float q = 0.57735026919 * xw - 0.33333333333 * zw; // sqrt(3)/3, 1/3
        float r = 0.66666666667 * zw; // 2/3
        float cx = q; float cz = r; float cy = -cx - cz;
        float rx = floor(cx + 0.5);
        float ry = floor(cy + 0.5);
        float rz = floor(cz + 0.5);
        float dx = abs(rx - cx), dy = abs(ry - cy), dz = abs(rz - cz);
        if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
        int row = int(rz);
        if (row < 0) row = 0; else if (row >= int(grid.y)) row = int(grid.y) - 1;
        int parity = row & 1;
        int col = int(rx + float((row - parity) >> 1));
        int sx = int(grid.x);
        int m = col % sx; if (m < 0) m += sx;
        return ivec2(m, row);
      }

      vec2 sampleMask(ivec2 tile, vec2 grid) {
        vec2 uv = (vec2(tile) + 0.5) / grid;
        return texture2D(maskTex, uv).rg;
      }

      void main(void) {
        vec4 base = texture2D(textureSampler, vUV);
        vec3 rayDir = worldRayFromUV(vUV);
        vec2 xz = intersectXZ(rayDir);
        ivec2 ij = worldXZToTile(xz, worldXZBounds, gridSize);
        vec2 mask = sampleMask(ij, gridSize);
        float known = mask.r;
        float visible = mask.g;

        vec3 color = base.rgb;
        if (known > 0.5 && visible < 0.5) {
          color *= exploredDim;
        }
        if (known < 0.5) {
          color = mix(color, vec3(0.0), unknownAlpha);
        }
        gl_FragColor = vec4(color, base.a);
      }
    `;
  }
}
