import type { Scene } from "@babylonjs/core";
import {
  Camera,
  Effect,
  PostProcess,
  RawTexture,
  Texture,
  Vector2,
  Vector4,
} from "@babylonjs/core";
import { watchEffect } from "vue";
import { getMapBounds } from "@/helpers/math";
import type { Coords } from "@/helpers/mapTools";
import { Tile } from "@/objects/game/Tile";
import type { GameKey } from "@/objects/game/_GameObject";
import { useSettingsStore } from "@/stores/settingsStore";
import { useObjectsStore } from "@/stores/objectStore";

export class FogOfWar {
  // === Fog of War tunables (kept internal; not user-adjustable) ===
  // How much to dim explored-but-not-currently-visible tiles (0..1, multiplier)
  exploredDim = 0.33;
  // Alpha to blend unknown areas toward black (0..1)
  // Dev QoL: set to 0.75 so player can orient on the map
  unknownDim = 1;

  // Inputs / configuration
  readonly scene: Scene;
  readonly size: Coords;

  // Logical state
  knownKeys: Set<GameKey>;
  visibleKeys: Set<GameKey>;

  // GPU/CPU resources
  maskBuffer!: Uint8Array;
  maskTexture!: RawTexture;
  public visibilityMask!: Uint8Array;
  private _keyToIndex = new Map<GameKey, number>();
  private _postProcesses = new Map<Camera, PostProcess>();
  private _stopHandles: (() => void)[] = [];
  private _ppStopHandles = new Map<Camera, () => void>();

  private _initialized = false;
  private _pendingProcess = false;

  constructor(size: Coords, scene: Scene) {
    // Required fields initialized in constructor (no lazy nulls)
    this.scene = scene;
    this.size = size;

    const player = useObjectsStore().currentPlayer;
    this.knownKeys = player.knownTileKeys.value;
    this.visibleKeys = player.visibleTileKeys.value;

    // init resources
    this.initResources();

    this._stopHandles.push(
      watchEffect(() => {
        this.knownKeys = player.knownTileKeys.value;
        this.visibleKeys = player.visibleTileKeys.value;
        this.triggerProcess();
      }),
    );
  }

  dispose(): void {
    // dispose of all data created during my lifespan
    this._stopHandles.forEach((handle) => handle());
    this._ppStopHandles.forEach((handle) => handle());
    this._ppStopHandles.clear();

    for (const postProcess of this._postProcesses.values()) {
      postProcess.dispose();
    }
    this._postProcesses.clear();
    if (this.maskTexture) this.maskTexture.dispose();
    // buffer is GC-managed
  }

  private triggerProcess() {
    if (this._pendingProcess) return;
    this._pendingProcess = true;

    // Coalesce updates in the same "tick"
    Promise.resolve().then(() => {
      this.process();
      this._pendingProcess = false;
    });
  }

  private process(): this {
    // Build or update RG mask from known/visible sets
    if (!this._initialized) this.initResources();

    const buffer = this.maskBuffer;
    const visibilityMask = this.visibilityMask;

    // Reset R and G channels. B is 0, A is 255.
    visibilityMask.fill(0);
    for (let index = 0; index < visibilityMask.length; index++) {
      const offset = index * 4;
      buffer[offset] = 0; // R
      buffer[offset + 1] = 0; // G
    }

    for (const key of this.knownKeys) {
      const index = this._keyToIndex.get(key);
      if (index !== undefined) {
        visibilityMask[index] = 1;
        buffer[index * 4] = 255;
      }
    }
    for (const key of this.visibleKeys) {
      const index = this._keyToIndex.get(key);
      if (index !== undefined) {
        visibilityMask[index] = 2;
        buffer[index * 4 + 1] = 255;
      }
    }

    this.maskTexture.update(buffer);
    return this;
  }

  private initResources(): void {
    if (this._initialized) return;
    const width = this.size.x;
    const height = this.size.y;
    this.maskBuffer = new Uint8Array(width * height * 4);
    this.visibilityMask = new Uint8Array(width * height);

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const index = row * width + col;
        this._keyToIndex.set(Tile.getKey(col, row), index);

        const offset = index * 4;
        this.maskBuffer[offset + 3] = 255; // Alpha is always 255
      }
    }

    this.maskTexture = RawTexture.CreateRGBATexture(
      this.maskBuffer,
      width,
      height,
      this.scene.getEngine(),
      false,
      false,
      Texture.NEAREST_SAMPLINGMODE,
    );
    this.maskTexture.wrapU = Texture.WRAP_ADDRESSMODE; // wrap X
    this.maskTexture.wrapV = Texture.CLAMP_ADDRESSMODE; // clamp Y

    // Register shader once
    this.registerShader();

    this._initialized = true;
  }

  public attachToCamera(camera: Camera): void {
    if (this._postProcesses.has(camera)) return;
    this.createPostProcess(camera);
  }

  private createPostProcess(camera: Camera): void {
    const size = this.size;
    const { minX, topZ, worldWidth, worldDepth } = getMapBounds(size);

    const postProcess = new PostProcess(
      "FoW",
      "fowProjector",
      ["invViewProjection", "worldXZBounds", "gridSize", "exploredDim", "unknownAlpha"],
      ["maskTex"],
      1.0,
      null,
      Texture.NEAREST_SAMPLINGMODE,
      this.scene.getEngine(),
    );

    postProcess.onApply = (effect) => {
      const invViewProjection = camera.getTransformationMatrix().clone().invert();
      effect.setMatrix("invViewProjection", invViewProjection);
      effect.setVector4("worldXZBounds", new Vector4(minX, topZ, worldWidth, worldDepth));
      effect.setVector2("gridSize", new Vector2(size.x, size.y));
      effect.setFloat("exploredDim", this.exploredDim);
      effect.setFloat("unknownAlpha", this.unknownDim);
      effect.setTexture("maskTex", this.maskTexture);
    };

    this._postProcesses.set(camera, postProcess);

    // Toggle post-process when settings change
    const stopWatcher = watchEffect(() => {
      const isEnabled = useSettingsStore().engineSettings.enableFogOfWar;
      const isAttached = postProcess.getCamera() === camera;
      if (isEnabled && !isAttached) {
        camera.attachPostProcess(postProcess);
      } else if (!isEnabled && isAttached) {
        camera.detachPostProcess(postProcess);
      }
    });
    this._ppStopHandles.set(camera, stopWatcher);
  }

  private registerShader(): void {
    if (Effect.ShadersStore["fowProjectorVertexShader"]) return;

    Effect.ShadersStore["fowProjectorVertexShader"] = `
      attribute vec2 position;
      varying vec2 vUV;
      void main(void) {
        gl_Position = vec4(position, 0.0, 1.0);
        vUV = position * 0.5 + 0.5;
      }
    `;

    Effect.ShadersStore["fowProjectorFragmentShader"] = `
      #ifdef GL_ES
      precision highp float;
      #endif

      varying vec2 vUV;
      uniform sampler2D textureSampler; // scene color
      uniform sampler2D maskTex; // RG mask

      uniform mat4 invViewProjection;
      uniform vec4 worldXZBounds; // (minX, topZ, worldWidth, worldDepth)
      uniform vec2 gridSize; // (sizeX, sizeY)
      uniform float exploredDim;
      uniform float unknownAlpha;

      vec2 intersectXZ(vec2 uv) {
        vec2 ndc = uv * 2.0 - 1.0;
        vec4 nearH = invViewProjection * vec4(ndc, 0.0, 1.0);
        vec4 farH  = invViewProjection * vec4(ndc, 1.0, 1.0);
        vec3 nearW = nearH.xyz / nearH.w;
        vec3 farW  = farH.xyz / farH.w;
        
        vec3 rayDir = farW - nearW;
        float denom = abs(rayDir.y) < 1e-5 ? (rayDir.y < 0.0 ? -1e-5 : 1e-5) : rayDir.y;
        float t = -nearW.y / denom;
        vec3 p = nearW + rayDir * t;
        return p.xz;
      }

      // Convert world XZ coordinates to tile grid indices (odd-r pointy-top hex layout).
      // This is the inverse of the tileCenter() function in math.ts.
      ivec2 worldXZToTile(vec2 xz, vec4 bounds, vec2 grid) {
        float minX = bounds.x;
        float topZ = bounds.y;

        // Calculate world-space distance from the top-left (minX, topZ)
        float worldX = xz.x - minX;
        float worldZ = topZ - xz.y;

        // Transform to axial hex coordinates (q, r).
        // Using constants for:
        // q = (sqrt(3)/3 * worldX - 1/3 * worldZ)
        // r = (2/3 * worldZ)
        float q = 0.57735026919 * worldX - 0.33333333333 * worldZ;
        float r = 0.66666666667 * worldZ;

        // Convert axial hex to cube coordinates (x, y, z) for robust rounding.
        float cx = q;
        float cz = r;
        float cy = -cx - cz;

        float rx = floor(cx + 0.5);
        float ry = floor(cy + 0.5);
        float rz = floor(cz + 0.5);

        // Find the axis with the largest rounding error and fix it to maintain x+y+z=0.
        float dx = abs(rx - cx);
        float dy = abs(ry - cy);
        float dz = abs(rz - cz);

        if (dx > dy && dx > dz) rx = -ry - rz;
        else if (dy > dz) ry = -rx - rz;
        else rz = -rx - ry;

        // Convert cube/axial back to offset coordinates (odd-row layout).
        int row = int(rz);
        // Clamp row to grid bounds.
        if (row < 0) row = 0;
        else if (row >= int(grid.y)) row = int(grid.y) - 1;

        int parity = row & 1;
        int col = int(rx + float((row - parity) >> 1));

        // Apply horizontal (X) wrapping.
        int gridWidth = int(grid.x);
        int wrappedCol = col % gridWidth;
        if (wrappedCol < 0) wrappedCol += gridWidth;

        return ivec2(wrappedCol, row);
      }

      vec2 sampleMask(ivec2 tile, vec2 grid) {
        vec2 uv = (vec2(tile) + 0.5) / grid;
        return texture2D(maskTex, uv).rg;
      }

      void main(void) {
        vec4 base = texture2D(textureSampler, vUV);
        vec2 xz = intersectXZ(vUV);
        ivec2 tileCoords = worldXZToTile(xz, worldXZBounds, gridSize);
        vec2 mask = sampleMask(tileCoords, gridSize);
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
