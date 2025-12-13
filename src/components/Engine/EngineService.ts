import type { WorldState } from "@/types/common";
import {
  ArcRotateCamera,
  ArcRotateCameraPointersInput,
  Color4,
  Engine as BabylonEngine,
  PointerEventTypes,
  Scene,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import {
  clamp,
  getWorldDepth,
  getWorldMaxX,
  getWorldMinX,
  getWorldMinZ,
  getWorldWidth,
  tileCenter,
} from "@/helpers/math";
import { TerrainMeshBuilder } from "@/factories/TerrainMeshBuilder/TerrainMeshBuilder";
import { useObjectsStore } from "@/stores/objectStore";
import { EnvironmentService } from "@/components/Engine/EnvironmentService";
import type { DefaultPostProcessingOptions } from "@/components/Engine/environments/postFx";
import type { WeatherType } from "@/components/Engine/environments/weather";
import LogicMeshBuilder from "@/factories/LogicMeshBuilder";
import { useHoveredTile } from "@/stores/hoveredTile";
import { Minimap } from "@/components/Engine/interaction/Minimap";
import FeatureInstancer from "@/components/Engine/features/FeatureInstancer";
import { FogOfWar } from "@/components/Engine/FogOfWar";
import type { Tile } from "@/objects/game/Tile";
import type { GameKey } from "@/objects/game/_GameObject";
import { getNeighbors } from "@/helpers/mapTools";
import type { Unit } from "@/objects/game/Unit";

export type EngineOptions = {
  // Camera UX
  manualTilt?: boolean; // Allow user to tilt manually (otherwise auto-tilt by zoom)

  // Resolution & performance
  renderScale?: number; // 1 = native CSS resolution, 0.5 = half res, 1.25 = super-sample
  fpsCap?: number; // 0 or undefined = uncapped; otherwise, minimum ms between renders enforced
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

  // Internal features (not exposed to end-user UI for now)
  fogOfWarEnabled?: boolean; // Enable/disable Fog of War post-process
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
  renderScale: 1,
  fpsCap: 0,
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
  fogOfWarEnabled: true,
};

export type EngineOptionPreset = { id: string; label: string; value: EngineOptions };

export const EngineOptionPresets: EngineOptionPreset[] = [
  {
    id: "low",
    label: "Low",
    value: {
      manualTilt: false,
      renderScale: 0.5,
      fpsCap: 30,
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
      fpsCap: 60,
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
      fpsCap: 0,
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
      fpsCap: 0,
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

export class EngineService {
  // Camera settings
  panSpeed = 5; // 1 = slow, 10 = fast
  maxRotation = Math.PI / 6; // bigger divisor = less rotation
  maxTilt = 0.8; // higher = more tilt upwards
  minTilt = 0.1; // 0 = top-down
  manualTilt = false; // Allow user to set tilt manually (false = auto-tilt by zoom)
  maxZoomIn = 10; // smaller = closer
  maxZoomOut = 100; // larger = further

  // Headless/game state
  world: WorldState;

  // Babylon rendering state
  engine: BabylonEngine;
  private _lastRenderTime = 0;
  scene: Scene;
  canvas: HTMLCanvasElement;
  minimap?: Minimap;

  tileRoot: TransformNode;

  camera: ArcRotateCamera;

  terrainBuilder: TerrainMeshBuilder;
  environmentService: EnvironmentService;
  logicMesh: LogicMeshBuilder;
  featureInstancer: FeatureInstancer;

  // Fog of War (main scene)
  private fogOfWar?: FogOfWar;

  // Options
  options: EngineOptions = { ...DefaultEngineOptions };
  private _rotationInput = new ArcRotateCameraPointersInput();
  private _manualTiltEnabled = false;

  // No animation state needed for simple, instant flyTo

  constructor(
    world: WorldState,
    canvas: HTMLCanvasElement,
    minimapCanvas?: HTMLCanvasElement,
    options?: EngineOptions,
  ) {
    this.world = world;
    this.canvas = canvas;
    this.options = { ...DefaultEngineOptions, ...(options ?? {}) };

    // Create Engine and Scene
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

    if (minimapCanvas) this.minimap = new Minimap(world, minimapCanvas, this.engine);

    // Resolution / hardware scaling
    this.applyRenderScale(this.options.renderScale ?? 1);

    // Create Cameras and Environment
    this.camera = this.initCamera();
    this.environmentService = new EnvironmentService(this.scene, this.camera, this.engine);

    // Build merged terrain mesh (new pipeline)
    this.terrainBuilder = new TerrainMeshBuilder(
      this.scene,
      { x: this.world.sizeX, y: this.world.sizeY },
      useObjectsStore().getTiles,
    );
    this.tileRoot = this.terrainBuilder.root;

    // Build logic mesh for interactions (thin-instance, invisible)
    this.logicMesh = new LogicMeshBuilder(
      this.scene,
      { x: this.world.sizeX, y: this.world.sizeY },
      useObjectsStore().getTiles,
    );

    // Wire hovered tile to a lightweight reactive store
    const hovered = useHoveredTile();
    this.logicMesh.onTileHover((tile) => hovered.set(tile));
    this.logicMesh.onTileExit(() => hovered.clear());

    this.featureInstancer = new FeatureInstancer(
      this.scene,
      this.world,
      Object.values(useObjectsStore().getTiles),
      this.tileRoot,
    ).setIsVisible(options?.showFeatures ?? true);

    // --- Fog of War (main scene) ---
    if (this.options.fogOfWarEnabled) {
      const tilesByKey = useObjectsStore().getTiles as Record<string, Tile>;
      const size = { x: this.world.sizeX, y: this.world.sizeY };
      const { knownKeys, visibleKeys } = this.computeInitialFogFromUnits(tilesByKey);
      this.fogOfWar = new FogOfWar(this.scene, size, tilesByKey, knownKeys, visibleKeys);
      this.fogOfWar.setEnabled(true);
    }

    // QoL: fly camera to the current player's first unit tile (if any)
    this.flyToFirstUnitTile();

    // Render loop with optional FPS cap
    this.engine.runRenderLoop(() => {
      if (this.options.fpsCap && this.options.fpsCap > 0) {
        const now = performance.now();
        const minDelta = 1000 / this.options.fpsCap;
        if (now - this._lastRenderTime < minDelta) return;
        this._lastRenderTime = now;
      }

      // Tick environment (clock/effects) before rendering
      const deltaSeconds = this.engine.getDeltaTime() / 1000;
      this.environmentService.update(deltaSeconds);
      this.scene.render();
    });

    // Resize to window
    this.engine.resize();
    window.addEventListener("resize", this.onResize);

    // Once the scene is ready, capture a one-time minimap image into the minimap canvas
    this.scene.executeWhenReady(() => {
      this.minimap?.capture();
    });
  }

  detach(): void {
    this.fogOfWar?.dispose();
    this.fogOfWar = undefined;
    window.removeEventListener("resize", this.onResize);
    this.engine.stopRenderLoop();
    this.featureInstancer.dispose();
    this.logicMesh.dispose();
    this.terrainBuilder.dispose();
    this.environmentService.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }

  // todo: if this is all attached to the store, why have this here?
  // ————————————————————————————————————————————
  // Logic mesh helpers / event surface
  onTileHover(handler: Parameters<LogicMeshBuilder["onTileHover"]>[0]): () => void {
    return this.logicMesh.onTileHover(handler);
  }

  onTileExit(handler: Parameters<LogicMeshBuilder["onTileExit"]>[0]): () => void {
    return this.logicMesh.onTileExit(handler);
  }

  onTileClick(handler: Parameters<LogicMeshBuilder["onTileClick"]>[0]): () => void {
    return this.logicMesh.onTileClick(handler);
  }

  onTileContextMenu(handler: Parameters<LogicMeshBuilder["onTileContextMenu"]>[0]): () => void {
    return this.logicMesh.onTileContextMenu(handler);
  }

  // todo move this to our settingsStore and remove from here
  setLogicDebugEnabled(enabled: boolean): this {
    this.logicMesh.setDebugEnabled(enabled);
    return this;
  }

  // todo this should not even be optional, but always set to enabled on engine init
  setPreventContextMenuDefault(enabled: boolean): this {
    this.logicMesh.setPreventContextMenuDefault(enabled);
    return this;
  }

  // Public: move instantly to a percentage of world width/depth (0..1 each)
  // todo add a super-super-simple 1s flying animation (never crossing world x-limits, even if wrap would be "closer")
  flyTo(xPercent: number, yPercent: number): EngineService {
    // Clamp percents
    const widthPercent = clamp(xPercent, 0, 1);
    const depthPercent = clamp(yPercent, 0, 1);

    // Map to world coordinates
    const worldWidth = getWorldWidth(this.world.sizeX);
    const worldDepth = getWorldDepth(this.world.sizeY);
    const target = new Vector3(
      getWorldMaxX(worldWidth) - widthPercent * worldWidth,
      0,
      getWorldMinZ(worldDepth) + depthPercent * worldDepth,
    );

    // Apply instantly
    this.camera.target.copyFrom(target);

    return this;
  }

  // todo move all camera-code to a separate class interaction/Camera.ts
  private initCamera(): ArcRotateCamera {
    if (!this.world) throw new Error("EngineService.init() must be called before attach()");

    // Create Camera at the World center with max zoom in
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2, // Look North
      this.maxTilt, // Full Tilt
      this.maxZoomIn, // Zoomed in
      new Vector3(0, 0, 0),
      this.scene,
    );
    this.camera = camera;

    // Controls (clear all, then add back the ones we want)
    camera.inputs.clear();

    // a) Zoom Control from the mouse wheel
    camera.inputs.addMouseWheel();
    camera.wheelDeltaPercentage = 0.02;
    camera.useNaturalPinchZoom = true;

    // b) Rotation Control from the mouse right and middle buttons
    camera.attachControl(this.canvas, true);
    camera.useAutoRotationBehavior = false;
    this._rotationInput.buttons = [1, 2]; // 1=right, 2=middle
    this._rotationInput.panningSensibility = 0;
    this.setManualTilt(!!this.options.manualTilt);

    // c) Panning Control from the mouse left button
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    this.scene.onPointerObservable.add((pi) => {
      const ev = pi.event;
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        if (ev.button === 0) {
          // 0 = Left mouse button
          dragging = true;
          lastX = ev.clientX;
          lastY = ev.clientY;
        }
      }

      if (pi.type === PointerEventTypes.POINTERUP) {
        dragging = false;
      }

      if (pi.type === PointerEventTypes.POINTERMOVE) {
        if (!dragging) return;

        const dx = ev.clientX - lastX;
        const dy = ev.clientY - lastY;
        lastX = ev.clientX;
        lastY = ev.clientY;

        // zoom-scaled speed
        const k = (this.panSpeed / 625) * (camera.radius / camera.lowerRadiusLimit!);

        camera.target.x += dx * k;
        camera.target.z -= dy * k;
      }
    });

    // Rotation/Tilt/Zoom limits

    // a) Rotation (Left-Right)
    const rotationNorth = Math.PI / 2;
    camera.lowerAlphaLimit = rotationNorth - this.maxRotation;
    camera.upperAlphaLimit = rotationNorth + this.maxRotation;

    // b) Tilt
    camera.upperBetaLimit = this.maxTilt; // How much the camera can tilt upwards towards the horizon
    camera.lowerBetaLimit = this.minTilt; // How close to top-down the camera can get

    // c) Zoom
    camera.lowerRadiusLimit = this.maxZoomIn;
    camera.upperRadiusLimit = this.maxZoomOut;

    // Panning and auto-tilt Camera values

    // World size math once
    const worldWidth = getWorldWidth(this.world.sizeX);
    const worldMinX = getWorldMinX(worldWidth);
    const worldMaxX = getWorldMaxX(worldWidth);

    // Clamp to N/S poles
    // Wrap X (West-East) for a simulated "globe" effect
    // Auto-tilt on zoom
    camera.onViewMatrixChangedObservable.add(() => {
      const t = camera.target;

      // Clamp Z (North-South) normally
      const minZ = -this.world!.sizeY / 1.385;
      const maxZ = this.world!.sizeY / 1.425;
      t.z = Math.min(Math.max(t.z, minZ), maxZ);

      // Wrap X (West-East)
      if (t.x > worldMaxX) t.x -= worldWidth;
      else if (t.x < worldMinX) t.x += worldWidth;

      // Auto-tilt if manualTilt === false
      if (!this.options.manualTilt) {
        const frac = (camera.radius - this.maxZoomIn) / (this.maxZoomOut - this.maxZoomIn);
        camera.beta = this.maxTilt - frac * (this.maxTilt - this.minTilt);
      }
    });

    return camera;
  }

  private onResize = () => {
    this.engine.resize();
  };

  // --- Fog of War helpers ---
  private flyToFirstUnitTile(): void {
    try {
      const objStore = useObjectsStore();
      const units = (objStore.currentPlayer.units.value as unknown as Unit[]) || [];
      if (!units.length) return;
      const tile = (units[0] as Unit).tile.value as Tile | null;
      if (!tile) return;

      // Compute world XZ of the tile center and convert to flyTo percents
      const worldWidth = getWorldWidth(this.world.sizeX);
      const worldDepth = getWorldDepth(this.world.sizeY);
      const worldMaxX = getWorldMaxX(worldWidth);
      const worldMinZ = getWorldMinZ(worldDepth);

      // Use math.tileCenter as single source of truth
      const center = tileCenter({ x: this.world.sizeX, y: this.world.sizeY }, tile);
      const centerX = center.x;
      const centerZ = center.z;

      const widthPercent = (worldMaxX - centerX) / worldWidth;
      const depthPercent = (centerZ - worldMinZ) / worldDepth;
      this.flyTo(widthPercent, depthPercent);
    } catch {
      // best-effort only
    }
  }
  private computeInitialFogFromUnits(tilesByKey: Record<string, Tile>): {
    knownKeys: GameKey[];
    visibleKeys: GameKey[];
  } {
    const objStore = useObjectsStore();
    const size = { x: this.world.sizeX, y: this.world.sizeY };
    const visible = new Set<GameKey>();
    const known = new Set<GameKey>();

    const units = (objStore.currentPlayer.units.value as unknown as Unit[]) || [];
    for (const u of units) {
      const tile = (u as Unit).tile.value as Tile | null;
      if (!tile) continue;
      // Visible: unit tile + hex distance 1 neighbors
      visible.add(tile.key as GameKey);
      const v1 = getNeighbors(size, tile, tilesByKey, "hex", 1);
      for (const t of v1) visible.add(t.key as GameKey);

      // Known: at minimum all visible, plus the hex distance 2 ring
      known.add(tile.key as GameKey);
      for (const t of v1) known.add(t.key as GameKey);
      const k2 = getNeighbors(size, tile, tilesByKey, "hex", 2);
      for (const t of k2) known.add(t.key as GameKey);
    }

    return { knownKeys: Array.from(known), visibleKeys: Array.from(visible) };
  }

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
    if (prev.fpsCap !== this.options.fpsCap) {
      this._lastRenderTime = 0; // reset limiter
    }
    if (prev.manualTilt !== this.options.manualTilt) {
      this.setManualTilt(!!this.options.manualTilt);
    }
    if (prev.showFeatures !== this.options.showFeatures) {
      this.setShowFeatures(!!this.options.showFeatures);
    }
    if (prev.fogOfWarEnabled !== this.options.fogOfWarEnabled) {
      if (this.options.fogOfWarEnabled) {
        if (!this.fogOfWar) {
          const tilesByKey = useObjectsStore().getTiles as Record<string, Tile>;
          const size = { x: this.world.sizeX, y: this.world.sizeY };
          const { knownKeys, visibleKeys } = this.computeInitialFogFromUnits(tilesByKey);
          this.fogOfWar = new FogOfWar(this.scene, size, tilesByKey, knownKeys, visibleKeys);
        }
        this.fogOfWar.setEnabled(true);
      } else {
        this.fogOfWar?.setEnabled(false);
      }
    }
    return { restartKeysChanged };
  }

  // --- Live toggles ---
  private setManualTilt(enabled: boolean) {
    // When enabled: add the rotation/tilt input (RMB/MMB) and disable panning from it.
    // When disabled: remove the rotation/tilt input and rely on auto-tilt behavior.
    if (enabled && !this._manualTiltEnabled) {
      this.camera.inputs.add(this._rotationInput);
      this._manualTiltEnabled = true;
    } else if (!enabled && this._manualTiltEnabled) {
      this.camera.inputs.remove(this._rotationInput);
      this._manualTiltEnabled = false;
    }
  }

  /** Set the time of day (0..2400). */
  public setTimeOfDay(timeOfDayValue2400: number): void {
    this.environmentService.setTimeOfDay(timeOfDayValue2400);
  }

  /** Set the season as a month index (1..12). */
  public setSeason(monthIndex1to12: number): void {
    this.environmentService.setSeason(monthIndex1to12);
  }

  /** Set the active weather type. */
  public setWeather(weatherType: WeatherType): void {
    this.environmentService.setWeather(weatherType);
  }

  // --- Fog of War integration surface ---
  /** Reveal tiles permanently (both in main scene and minimap, if present). */
  public revealTiles(tiles: Tile[]): void {
    this.fogOfWar?.addKnownTiles(tiles);
    this.minimap?.addKnownTiles(tiles);
  }

  /** Replace current visible tiles (both in main scene and minimap). */
  public setVisibleTiles(tiles: Tile[]): void {
    this.fogOfWar?.setVisibleTiles(tiles);
    this.minimap?.setVisibleTiles(tiles);
  }

  /** Start or stop the environment's internal clock. */
  public setIsClockRunning(isRunning: boolean): void {
    this.environmentService.setIsClockRunning(isRunning);
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

  updateFeatureTiles(): this {
    this.featureInstancer.set(Object.values(useObjectsStore().getTiles));
    return this;
  }
}
