import {
  ArcRotateCamera,
  Color4,
  Engine as BabylonEngine,
  Scene,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import {
  clamp,
  getWorldDepth,
  getWorldMinX,
  getWorldMinZ,
  getWorldWidth,
  tileCenter,
} from "@/helpers/math";
import { TerrainMeshBuilder } from "@/factories/TerrainMeshBuilder/TerrainMeshBuilder";
import { useObjectsStore } from "@/stores/objectStore";
import { EnvironmentService } from "@/components/Engine/EnvironmentService";
import type { DefaultPostProcessingOptions } from "@/components/Engine/environments/postFx";
import LogicMeshBuilder from "@/factories/LogicMeshBuilder";
import { useHoveredTile } from "@/stores/hoveredTile";
import { Minimap } from "@/components/Engine/interaction/Minimap";
import { MainCamera } from "@/components/Engine/interaction/MainCamera";
import FeatureInstancer from "@/components/Engine/features/FeatureInstancer";
import { FogOfWar } from "@/components/Engine/FogOfWar";
import GridOverlay from "@/components/Engine/overlays/GridOverlay";
import type { Tile } from "@/objects/game/Tile";
import type { GameKey } from "@/objects/game/_GameObject";
import { Coords, getCoordsFromTileKey } from "@/helpers/mapTools";
import { EngineCoords } from "@/factories/TerrainMeshBuilder/_terrainMeshTypes";

export type EngineOptions = {
  // Camera UX
  manualTilt?: boolean; // Allow user to tilt manually (otherwise auto-tilt by zoom)
  // Overlays
  showGrid?: boolean; // Show/hide hex grid overlay

  // Resolution & performance
  renderScale?: number; // 1 = native CSS resolution, 0.5 = half res, 1.25 = super-sample
  adaptToDeviceRatio?: boolean; // Use devicePixelRatio for base resolution (restart required)

  // Engine/GPU flags (restart required)
  antialias?: boolean; // Multi-sample antialias at context level (restart required)
  preserveDrawingBuffer?: boolean;
  stencil?: boolean;
  disableWebGL2Support?: boolean; // Force WebGL1 if true
  powerPreference?: WebGLPowerPreference; // "default" | "high-performance" | "low-power"

  // Visual effects (post-process pipeline)
  hdr?: boolean; // Enable HDR pipeline when supported
  useFxaa?: boolean; // FXAA post-process
  useBloom?: boolean; // Bloom post-process
  bloomThreshold?: number; // 0..1
  bloomWeight?: number; // 0..1

  // Feature layers
  showFeatures?: boolean; // Toggle GPU-instanced feature props (trees etc.)
};

export const RestartRequiredOptionKeys: (keyof EngineOptions)[] = [
  "antialias",
  "preserveDrawingBuffer",
  "stencil",
  "disableWebGL2Support",
  "powerPreference",
  "adaptToDeviceRatio",
];

export const DefaultEngineOptions: Required<EngineOptions> = {
  manualTilt: false,
  showGrid: true,
  renderScale: 1,
  adaptToDeviceRatio: false,
  antialias: true,
  preserveDrawingBuffer: true,
  stencil: true,
  disableWebGL2Support: false,
  powerPreference: "high-performance",
  hdr: true,
  useFxaa: true,
  useBloom: false,
  bloomThreshold: 0.9,
  bloomWeight: 0.15,
  showFeatures: true,
};

export type EngineOptionPreset = { id: string; label: string; value: EngineOptions };

export const EngineOptionPresets: EngineOptionPreset[] = [
  {
    id: "low",
    label: "Low",
    value: {
      manualTilt: false,
      renderScale: 0.5,
      adaptToDeviceRatio: false,
      antialias: false,
      preserveDrawingBuffer: false,
      stencil: false,
      disableWebGL2Support: false,
      powerPreference: "low-power",
      hdr: false,
      useFxaa: false,
      useBloom: false,
    } as EngineOptions,
  },
  {
    id: "medium",
    label: "Medium",
    value: {
      manualTilt: false,
      renderScale: 0.75,
      adaptToDeviceRatio: false,
      antialias: true,
      preserveDrawingBuffer: false,
      stencil: false,
      disableWebGL2Support: false,
      powerPreference: "default",
      hdr: false,
      useFxaa: true,
      useBloom: false,
    } as EngineOptions,
  },
  {
    id: "high",
    label: "High",
    value: {
      manualTilt: false,
      renderScale: 1.0,
      adaptToDeviceRatio: false,
      antialias: true,
      preserveDrawingBuffer: true,
      stencil: true,
      disableWebGL2Support: false,
      powerPreference: "high-performance",
      hdr: true,
      useFxaa: true,
      useBloom: true,
      bloomThreshold: 0.9,
      bloomWeight: 0.15,
    } as EngineOptions,
  },
  {
    id: "ultra",
    label: "Ultra",
    value: {
      manualTilt: false,
      renderScale: 1.0, // keep safe by default; user can increase manually
      adaptToDeviceRatio: true,
      antialias: true,
      preserveDrawingBuffer: true,
      stencil: true,
      disableWebGL2Support: false,
      powerPreference: "high-performance",
      hdr: true,
      useFxaa: true,
      useBloom: true,
      bloomThreshold: 0.85,
      bloomWeight: 0.2,
    } as EngineOptions,
  },
];

// noinspection JSUnusedGlobalSymbols
export class EngineService {
  size: Coords;
  canvas: HTMLCanvasElement;
  engine!: BabylonEngine;
  scene!: Scene;
  tileRoot!: TransformNode;

  camera!: ArcRotateCamera;
  mainCamera!: MainCamera;
  environmentService!: EnvironmentService;
  terrainBuilder!: TerrainMeshBuilder;
  logicMesh!: LogicMeshBuilder;
  featureInstancer!: FeatureInstancer;
  fogOfWar!: FogOfWar;
  gridOverlay?: GridOverlay;

  minimapCanvas?: HTMLCanvasElement;
  minimap?: Minimap;

  options: EngineOptions = { ...DefaultEngineOptions };

  constructor(
    size: Coords,
    canvas: HTMLCanvasElement,
    minimapCanvas?: HTMLCanvasElement,
    options?: EngineOptions,
  ) {
    // Prevent strange bugs from happening
    if (size.x <= 0 || size.y <= 0) throw new Error("Invalid map size");

    this.size = size;
    this.canvas = canvas;
    this.minimapCanvas = minimapCanvas;
    this.options = { ...DefaultEngineOptions, ...(options ?? {}) };
  }

  initEngine(): this {
    this.engine = new BabylonEngine(
      this.canvas,
      this.options.antialias ?? true,
      {
        preserveDrawingBuffer: this.options.preserveDrawingBuffer ?? true,
        stencil: this.options.stencil ?? true,
        disableWebGL2Support: this.options.disableWebGL2Support ?? false,
        powerPreference: this.options.powerPreference ?? "high-performance",
      },
      this.options.adaptToDeviceRatio ?? false,
    );
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.63, 0.63, 0.63, 1); // Same-ish as snow

    // Allow for easy debugging
    // eslint-disable-next-line
    (document as any).engineService = this;

    return this;
  }

  initCamera(): this {
    this.applyRenderScale(this.options.renderScale ?? 1);
    this.mainCamera = new MainCamera(this.size, this.scene, this.canvas, {
      manualTilt: this.options.manualTilt,
    });
    this.camera = this.mainCamera.camera;

    this.flyToCurrentPlayer();

    // Initialize camera-dependent visuals immediately
    this.applyCameraZoomEffects();

    return this;
  }

  initEnvironment(): this {
    this.environmentService = new EnvironmentService(this.scene, this.camera, this.engine);

    return this;
  }

  initLogic(): this {
    this.logicMesh = new LogicMeshBuilder(
      this.scene,
      this.size,
      useObjectsStore().getTiles,
    ).build();

    const hovered = useHoveredTile();
    this.logicMesh.onTileHover((tile) => hovered.set(tile));
    this.logicMesh.onTileExit(() => hovered.clear());

    return this;
  }

  initTerrain(): this {
    this.terrainBuilder = new TerrainMeshBuilder(this.scene, this.size, useObjectsStore().getTiles);
    this.tileRoot = this.terrainBuilder.root;

    return this;
  }

  private initGridOverlay(): this {
    // Build overlay once and set its visibility according to options
    if (!this.gridOverlay) {
      this.gridOverlay = new GridOverlay(this.scene, this.size, useObjectsStore().getTiles);
    }
    this.gridOverlay.setVisible(this.options.showGrid ?? true);
    // Apply initial thickness based on current zoom
    this.applyCameraZoomEffects();
    return this;
  }

  initFeatures(): this {
    this.featureInstancer = new FeatureInstancer(
      this.scene,
      this.size,
      Object.values(useObjectsStore().getTiles),
      this.tileRoot,
    ).setIsVisible(this.options.showFeatures ?? true);

    return this;
  }

  initFogOfWar(): this {
    const storeKnown = useObjectsStore().currentPlayer.knownTileKeys.value as GameKey[];
    const storeVisible = useObjectsStore().currentPlayer.visibleTileKeys.value as GameKey[];

    this.fogOfWar = new FogOfWar(
      this.size,
      this.scene,
      this.camera,
      useObjectsStore().getTiles,
      storeKnown,
      storeVisible,
    );
    return this;
  }

  render(): this {
    this.engine.runRenderLoop(() => {
      // Tick environment (clock/effects) before rendering
      const deltaSeconds = this.engine.getDeltaTime() / 1000;
      this.environmentService.update(deltaSeconds);
      // Centralized camera-position dependent adjustments
      this.applyCameraZoomEffects();
      this.scene.render();
    });

    // Resize to window
    this.engine.resize();
    window.addEventListener("resize", this.onResize);

    return this;
  }

  /**
   * Central place to apply camera position / zoom dependent visual adjustments.
   * Keep KISS: calculate normalized zoom and drive overlays from here.
   */
  private applyCameraZoomEffects(): void {
    if (!this.camera) return;
    // Normalize zoom: 0 at max zoom-out (upperRadius), 1 at max zoom-in (lowerRadius)
    const lower = this.camera.lowerRadiusLimit ?? 10;
    const upper = this.camera.upperRadiusLimit ?? 100;
    const denom = Math.max(0.0001, upper - lower);
    const r = this.camera.radius;
    const norm = clamp((upper - r) / denom, 0, 1);

    // Grid thickness scaling: 0.25x at max out -> 1.5x at max in
    const thicknessScale = 0.25 + norm * 1.25;
    if (this.gridOverlay) this.gridOverlay.setThicknessScale(thicknessScale);
  }

  initMinimap(): this {
    if (this.minimapCanvas) {
      this.minimap = new Minimap(this.size, this.minimapCanvas, this.engine, this.fogOfWar);
      this.minimap.capture();
    }

    return this;
  }

  initOrder() {
    return [
      () => this.initEngine(),
      () => this.initCamera(),
      () => this.initEnvironment(),
      () => this.initLogic(),
      () => this.initTerrain(),
      () => this.initGridOverlay(),
      () => this.initFeatures(),
      () => this.initFogOfWar(),
      () => this.render(),
      () => this.initMinimap(),
    ];
  }

  init(): this {
    this.initOrder().forEach((fn) => fn());
    return this;
  }

  dispose(): void {
    if (this.gridOverlay) {
      this.gridOverlay.dispose();
      this.gridOverlay = undefined;
    }
    this.fogOfWar.dispose();
    window.removeEventListener("resize", this.onResize);
    this.engine.stopRenderLoop();
    this.featureInstancer.dispose();
    this.logicMesh.dispose();
    this.terrainBuilder.dispose();
    this.environmentService.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }

  // todo move this to our settingsStore and remove from here
  setLogicDebugEnabled(enabled: boolean): this {
    this.logicMesh.setDebugEnabled(enabled);
    return this;
  }

  flyTo(coords: EngineCoords): EngineService {
    const target = new Vector3(coords.x, 0, coords.z);

    // Apply instantly
    // todo add a super-super-simple 1s flying animation (never crossing world x-limits, even if wrap would be "closer")
    this.camera.target.copyFrom(target);

    return this;
  }

  flyToCurrentPlayer(): void {
    const currentPlayer = useObjectsStore().currentPlayer;

    // Capital or first unit
    const capital = currentPlayer.cities.value.find((c) => c.isCapital);
    if (capital) {
      this.flyToTile(capital.tileKey);
    }

    const unit = currentPlayer.units.value[0];
    if (unit) {
      this.flyToTile(unit.tileKey.value);
    }

    return;
  }

  // Public: move instantly to a percentage of world width/depth (0..1 each)
  flyToPercent(xPercent: number, yPercent: number): EngineService {
    // Clamp percents
    const widthPercent = clamp(xPercent, 0, 1);
    const depthPercent = clamp(yPercent, 0, 1);

    // Map to world coordinates
    const worldWidth = getWorldWidth(this.size.x);
    const worldDepth = getWorldDepth(this.size.y);
    return this.flyTo({
      x: getWorldMinX(worldWidth) + widthPercent * worldWidth,

      // Flip Z (y=0 is north, y=max is south)
      z: getWorldMinZ(worldDepth) - depthPercent * worldDepth,
    });
  }

  flyToTile(tile: GameKey | string | Tile): EngineService {
    if (typeof tile === "string") {
      const coords = getCoordsFromTileKey(tile as GameKey);
      return this.flyTo(tileCenter(this.size, coords));
    } else {
      return this.flyTo(tileCenter(this.size, tile));
    }
  }

  private onResize = () => {
    this.engine.resize();
  };

  // --- Options application helpers ---
  private applyRenderScale(scale: number) {
    const safeScale = Math.max(0.25, Math.min(2, scale || 1));
    const level = 1 / safeScale;
    this.engine.setHardwareScalingLevel(level);
  }

  applyOptions(next: EngineOptions): { restartKeysChanged: (keyof EngineOptions)[] } {
    const prev = this.options;
    this.options = { ...prev, ...next };

    // Collect restart-required changes
    const restartKeysChanged: (keyof EngineOptions)[] = [];
    for (const k of RestartRequiredOptionKeys) {
      if (prev[k] !== this.options[k]) restartKeysChanged.push(k);
    }

    // Live-applied options
    if (prev.renderScale !== this.options.renderScale) {
      this.applyRenderScale(this.options.renderScale ?? 1);
    }
    if (prev.manualTilt !== this.options.manualTilt) {
      this.mainCamera.setManualTilt(!!this.options.manualTilt);
    }
    if (prev.showGrid !== this.options.showGrid) {
      // Create overlay on demand if needed
      if (!this.gridOverlay) {
        this.gridOverlay = new GridOverlay(this.scene, this.size, useObjectsStore().getTiles);
      }
      this.gridOverlay.setVisible(!!this.options.showGrid);
    }
    if (prev.showFeatures !== this.options.showFeatures) {
      this.setShowFeatures(!!this.options.showFeatures);
    }
    return { restartKeysChanged };
  }

  /** Update post-processing toggles/values for the environment's rendering pipeline. */
  public setEnvironmentPostProcessingOptions(options: Partial<DefaultPostProcessingOptions>): void {
    this.environmentService.setPostProcessingOptions(options);
  }

  // Feature layers
  setShowFeatures(showFeatures: boolean): this {
    this.featureInstancer.setIsVisible(showFeatures);
    return this;
  }
}
