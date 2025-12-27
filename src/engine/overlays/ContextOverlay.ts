import {
  Camera,
  Color3,
  Effect,
  Observer,
  PostProcess,
  RawTexture,
  RenderingGroupInfo,
  Scene,
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
import { BaseOverlay } from "./BaseOverlay";
import { EngineGroups, EngineOverlayColors } from "@/engine/EngineStyles";

export type ContextHighlight = { tile: Tile; colorId: string; alpha: number };
export type ContextPayload = { items: ContextHighlight[] };

export interface ContextOverlayOptions {
  enableFoW?: boolean;
  enableHighlights?: boolean;
  /** If true, the post-process is always attached regardless of settings.enableFogOfWar */
  alwaysEnable?: boolean;
}

/**
 * Custom extension of PostProcess to support the 'enabled' property
 * used by the rendering group 'sandwich' logic.
 */
interface ContextPostProcess extends PostProcess {
  enabled: boolean;
}

/**
 * ContextOverlay manages the Fog of War and GPU-based tile highlights.
 * Refactored to use BaseOverlay for layer orchestration.
 */
export class ContextOverlay extends BaseOverlay<ContextPayload> {
  // FoW Tunables
  exploredDim = 0.33;
  unknownDim = 1.0;

  private readonly palette: Map<string, { color: Color3; index: number }> = new Map();
  private readonly paletteArray: Float32Array = new Float32Array(16 * 3); // Max 16 colors for now

  private readonly tileKeyToIndex = new Map<GameKey, number>();
  private readonly maskBuffer: Uint8Array;
  private readonly maskTexture: RawTexture;

  private readonly postProcesses = new Map<Camera, ContextPostProcess>();
  private readonly postProcessObservers = new Map<Camera, Observer<RenderingGroupInfo>>();
  private readonly postProcessStopHandles = new Map<Camera, () => void>();
  private readonly cleanupStopHandles: (() => void)[] = [];

  constructor(
    private readonly scene: Scene,
    private readonly size: Coords,
  ) {
    super();

    const width = this.size.x;
    const height = this.size.y;
    this.maskBuffer = new Uint8Array(width * height * 4);

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const index = row * width + col;
        this.tileKeyToIndex.set(Tile.getKey(col, row), index);
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
    this.maskTexture.wrapU = Texture.WRAP_ADDRESSMODE;
    this.maskTexture.wrapV = Texture.CLAMP_ADDRESSMODE;

    this.registerShader();

    // Default Palette
    this.setPalette(EngineOverlayColors);

    // Sync FoW state from ObjectStore
    this.cleanupStopHandles.push(
      watchEffect(() => {
        const player = useObjectsStore().currentPlayer;
        // Explicitly access values synchronously to register Vue dependencies
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        player.knownTileKeys;
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        player.visibleTileKeys;

        // Direct trigger of refresh when visibility state changes
        this.triggerRefresh();
      }),
    );
  }

  protected onRefresh(): void {
    const player = useObjectsStore().currentPlayer;
    this.maskBuffer.fill(0);

    // 1. Fill FoW (R: Known, G: Visible)
    for (const key of player.knownTileKeys.value) {
      const index = this.tileKeyToIndex.get(key);
      if (index !== undefined) this.maskBuffer[index * 4] = 255;
    }
    for (const key of player.visibleTileKeys.value) {
      const index = this.tileKeyToIndex.get(key);
      if (index !== undefined) this.maskBuffer[index * 4 + 1] = 255;
    }

    // 2. Fill Highlights (B: Alpha, A: Palette Index)
    for (const [layerId, payload] of this.layers) {
      if (!this.layerVisibility.get(layerId)) continue;
      for (const item of payload.items) {
        const index = this.tileKeyToIndex.get(item.tile.key);
        const colorInfo = this.palette.get(item.colorId);
        if (index !== undefined && colorInfo) {
          this.maskBuffer[index * 4 + 2] = Math.floor(item.alpha * 255);
          this.maskBuffer[index * 4 + 3] = colorInfo.index;
        }
      }
    }

    this.maskTexture.update(this.maskBuffer);
  }

  attachToCamera(camera: Camera, options?: ContextOverlayOptions): void {
    if (this.postProcesses.has(camera)) return;

    const { minX, topZ, worldWidth, worldDepth } = getMapBounds(this.size);

    const postProcess = new PostProcess(
      "ContextOverlay",
      "contextProjector",
      [
        "invViewProjection",
        "worldXZBounds",
        "gridSize",
        "exploredDim",
        "unknownAlpha",
        "palette",
        "enableFoW",
        "enableHighlights",
      ],
      ["maskTex"],
      1.0,
      null,
      Texture.NEAREST_SAMPLINGMODE,
      this.scene.getEngine(),
    ) as ContextPostProcess;

    postProcess.enabled = true;

    postProcess.onApply = (effect) => {
      const invViewProjection = camera.getTransformationMatrix().clone().invert();
      effect.setMatrix("invViewProjection", invViewProjection);
      effect.setVector4("worldXZBounds", new Vector4(minX, topZ, worldWidth, worldDepth));
      effect.setVector2("gridSize", new Vector2(this.size.x, this.size.y));
      effect.setFloat("exploredDim", this.exploredDim);
      effect.setFloat("unknownAlpha", this.unknownDim);
      effect.setFloatArray("palette", this.paletteArray);
      effect.setTexture("maskTex", this.maskTexture);

      const settings = useSettingsStore();
      const isFogOfWarEnabled = options?.enableFoW ?? settings.engineSettings.enableFogOfWar;
      effect.setBool("enableFoW", isFogOfWarEnabled);
      effect.setBool("enableHighlights", options?.enableHighlights ?? true);
    };

    this.postProcesses.set(camera, postProcess);

    const observer = this.scene.onBeforeRenderingGroupObservable.add((info: RenderingGroupInfo) => {
      if (info.camera !== camera) return;

      const settings = useSettingsStore();
      const isFogOfWarEnabled = settings.engineSettings.enableFogOfWar;

      // Only apply FoW effect to World (0) and Units (2) groups.
      // If FoW is disabled globally, the post-process remains enabled for Highlights.
      postProcess.enabled =
        !isFogOfWarEnabled ||
        info.renderingGroupId === EngineGroups.world ||
        info.renderingGroupId === EngineGroups.units;
    });

    if (observer) {
      this.postProcessObservers.set(camera, observer);
    }

    const settings = useSettingsStore();
    const stopHandle = watchEffect(() => {
      if (options?.alwaysEnable || settings.engineSettings.enableFogOfWar) {
        camera.attachPostProcess(postProcess);
      } else {
        camera.detachPostProcess(postProcess);
      }
    });

    this.postProcessStopHandles.set(camera, stopHandle);
  }

  dispose(): void {
    this.cleanupStopHandles.forEach((handle) => handle());
    this.postProcessStopHandles.forEach((handle) => handle());
    this.postProcessObservers.forEach((observer) => {
      this.scene.onBeforeRenderingGroupObservable.remove(observer);
    });
    this.postProcessObservers.clear();
    for (const postProcess of this.postProcesses.values()) postProcess.dispose();
    if (this.maskTexture) this.maskTexture.dispose();
  }

  setPalette(palette: Record<string, Color3>): void {
    this.palette.clear();
    let index = 1; // 0 is reserved for "no highlight"
    for (const [id, color] of Object.entries(palette)) {
      this.palette.set(id, { color, index });
      this.paletteArray[index * 3] = color.r;
      this.paletteArray[index * 3 + 1] = color.g;
      this.paletteArray[index * 3 + 2] = color.b;
      index++;
      if (index >= 16) break;
    }
    this.triggerRefresh();
  }

  private registerShader(): void {
    if (Effect.ShadersStore["contextProjectorVertexShader"]) return;

    Effect.IncludesShadersStore["hexMath"] = `
      ivec2 worldXZToTile(vec2 xz, vec4 bounds, vec2 grid) {
        float worldX = xz.x - bounds.x;
        float worldZ = bounds.y - xz.y;
        float q = 0.57735026919 * worldX - 0.33333333333 * worldZ;
        float r = 0.66666666667 * worldZ;
        float cx = q;
        float cz = r;
        float cy = -cx - cz;
        float rx = floor(cx + 0.5);
        float ry = floor(cy + 0.5);
        float rz = floor(cz + 0.5);
        float dx = abs(rx - cx);
        float dy = abs(ry - cy);
        float dz = abs(rz - cz);
        if (dx > dy && dx > dz) rx = -ry - rz;
        else if (dy > dz) ry = -rx - rz;
        else rz = -rx - ry;
        int row = int(rz);
        if (row < 0) row = 0;
        else if (row >= int(grid.y)) row = int(grid.y) - 1;
        int parity = row & 1;
        int col = int(rx + float((row - parity) >> 1));
        int gridWidth = int(grid.x);
        int wrappedCol = col % gridWidth;
        if (wrappedCol < 0) wrappedCol += gridWidth;
        return ivec2(wrappedCol, row);
      }
    `;

    Effect.ShadersStore["contextProjectorVertexShader"] = `
      attribute vec2 position;
      varying vec2 vUV;
      void main(void) {
        gl_Position = vec4(position, 0.0, 1.0);
        vUV = position * 0.5 + 0.5;
      }
    `;

    Effect.ShadersStore["contextProjectorFragmentShader"] = `
      #ifdef GL_ES
      precision highp float;
      #endif

      varying vec2 vUV;
      uniform sampler2D textureSampler;
      uniform sampler2D maskTex;

      uniform mat4 invViewProjection;
      uniform vec4 worldXZBounds;
      uniform vec2 gridSize;
      uniform float exploredDim;
      uniform float unknownAlpha;
      uniform bool enableFoW;
      uniform bool enableHighlights;
      uniform float palette[48]; // 16 * 3

      vec2 intersectXZ(vec2 uv) {
        vec2 ndc = uv * 2.0 - 1.0;
        vec4 nearH = invViewProjection * vec4(ndc, 0.0, 1.0);
        vec4 farH  = invViewProjection * vec4(ndc, 1.0, 1.0);
        vec3 nearW = nearH.xyz / nearH.w;
        vec3 farW  = farH.xyz / farH.w;
        vec3 rayDir = farW - nearW;
        float denom = abs(rayDir.y) < 1e-5 ? (rayDir.y < 0.0 ? -1e-5 : 1e-5) : rayDir.y;
        float t = -nearW.y / denom;
        return (nearW + rayDir * t).xz;
      }

      #include<hexMath>

      void main(void) {
        vec4 base = texture2D(textureSampler, vUV);
        vec2 xz = intersectXZ(vUV);
        ivec2 tileCoords = worldXZToTile(xz, worldXZBounds, gridSize);
        vec2 uv = (vec2(tileCoords) + 0.5) / gridSize;
        vec4 mask = texture2D(maskTex, uv);

        float known = mask.r;
        float visible = mask.g;
        float highAlpha = mask.b;
        int palIdx = int(mask.a * 255.0 + 0.5);

        vec3 color = base.rgb;

        // Apply Highlight
        if (enableHighlights && palIdx > 0 && highAlpha > 0.0) {
          vec3 highColor = vec3(palette[palIdx * 3], palette[palIdx * 3 + 1], palette[palIdx * 3 + 2]);
          color = mix(color, highColor, highAlpha);
        }

        // Apply FoW
        if (enableFoW) {
          if (known > 0.5 && visible < 0.5) {
            color *= exploredDim;
          }
          if (known < 0.5) {
            color = mix(color, vec3(0.0), unknownAlpha);
          }
        }

        gl_FragColor = vec4(color, base.a);
      }
    `;
  }
}
