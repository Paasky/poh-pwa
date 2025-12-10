import type { WorldState } from "@/types/common";
import {
  ArcRotateCamera,
  ArcRotateCameraPointersInput,
  Camera,
  Color3,
  Color4,
  DirectionalLight,
  Engine as BabylonEngine,
  HemisphericLight,
  PointerEventTypes,
  Scene,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
// Required side-effect to register ShadowGenerator with the Scene
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { CreateScreenshotUsingRenderTarget } from "@babylonjs/core/Misc/screenshotTools";
import {
  clamp,
  getWorldDepth,
  getWorldMaxX,
  getWorldMinX,
  getWorldMinZ,
  getWorldWidth,
} from "@/helpers/math";
import { TerrainMeshBuilder } from "@/factories/TerrainMeshBuilder/TerrainMeshBuilder";
import { useObjectsStore } from "@/stores/objectStore";

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
  scene: Scene;
  canvas: HTMLCanvasElement;
  minimapCanvas: HTMLCanvasElement | null = null;

  camera: ArcRotateCamera;
  minimapCamera: ArcRotateCamera;
  light: HemisphericLight;
  sunLight!: DirectionalLight;
  shadowGen!: ShadowGenerator;
  tileRoot: TransformNode;
  terrainBuilder: TerrainMeshBuilder;

  // Options & rendering pipeline
  options: EngineOptions = { ...DefaultEngineOptions };
  pipeline?: DefaultRenderingPipeline;
  private _lastRenderTime = 0;
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
    if (minimapCanvas) this.minimapCanvas = minimapCanvas;
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

    // Resolution / hardware scaling
    this.applyRenderScale(this.options.renderScale ?? 1);

    // Create Cameras and Light
    this.camera = this.initCamera();
    this.minimapCamera = this.initMinimap();
    this.light = this.initLight();

    // Post-process pipeline (FXAA / Bloom / HDR)
    this.rebuildPipeline();

    // Build merged terrain mesh (new pipeline)
    this.terrainBuilder = new TerrainMeshBuilder(
      this.scene,
      { x: this.world.sizeX, y: this.world.sizeY },
      useObjectsStore().getTiles,
    );
    this.tileRoot = this.terrainBuilder.build().root;

    // Shadows: make terrain cast/receive
    const land = this.terrainBuilder.getMesh();
    if (land) {
      land.receiveShadows = true;
      this.shadowGen.addShadowCaster(land, true);
    }
    const water = this.scene.getMeshByName("terrain.water.plane");
    if (water) {
      // Optional: water receives soft shadows from terrain
      water.receiveShadows = true;
    }

    // Once the scene is ready, capture a one-time minimap image into the minimap canvas
    this.scene.executeWhenReady(() => {
      this.captureMinimap();
    });

    // Render loop with optional FPS cap
    this.engine.runRenderLoop(() => {
      if (this.options.fpsCap && this.options.fpsCap > 0) {
        const now = performance.now();
        const minDelta = 1000 / this.options.fpsCap;
        if (now - this._lastRenderTime < minDelta) return;
        this._lastRenderTime = now;
      }
      this.scene.render();
    });

    // Resize to window
    this.engine.resize();
    window.addEventListener("resize", this.onResize);
  }

  captureMinimap(): EngineService {
    if (!this.minimapCanvas) return this;
    // Render a 512x256 screenshot using the orthographic minimap camera and draw it to the canvas
    const width = 512;
    const height = 256;

    CreateScreenshotUsingRenderTarget(
      this.engine,
      this.minimapCamera,
      { width, height },
      (data) => {
        const ctx = this.minimapCanvas!.getContext("2d");
        if (!ctx) return;
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = data as string;
      },
    );

    return this;
  }

  detach(): void {
    window.removeEventListener("resize", this.onResize);
    this.engine.stopRenderLoop();
    this.terrainBuilder.dispose();
    if (this.pipeline) {
      this.pipeline.dispose();
      this.pipeline = undefined;
    }
    this.scene.dispose();
    this.engine.dispose();
  }

  // Public: move instantly to a percentage of world width/depth (0..1 each)
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

  private initLight(): HemisphericLight {
    // Ambient fill light so shaded areas are not fully black
    const hemi = new HemisphericLight("light.ambient", new Vector3(0, 1, 0), this.scene);
    // Reduce ambient to deepen shadows and remove hemi specular highlights
    hemi.intensity = 0.5;
    // Remove hemispheric specular contribution (reflections come from sun only)
    // noinspection SuspiciousTypeOfGuard
    (hemi as unknown as { specular?: Color3 }).specular = Color3.Black();

    // Sun directional light for shadows
    // We'll drive its direction dynamically relative to the camera each frame so
    // shadows remain readable: sun sits lower in the sky and behind the camera view.
    const sun = new DirectionalLight("light.sun", new Vector3(0, 1, 0), this.scene);
    // Boost sun to compensate for lower ambient and create stronger, darker shadows
    sun.intensity = 1;
    this.sunLight = sun;

    // Shadow generator
    const sg = new ShadowGenerator(2048, sun);
    sg.bias = 0.0005;
    sg.normalBias = 0.02;
    sg.usePoissonSampling = true; // stable, good default across platforms
    this.shadowGen = sg;

    // Keep the sun anchored around the camera target so shadow map follows panning
    // Place it further back and lower to make shadows more apparent.
    const followDistance = 100;
    this.scene.onBeforeRenderObservable.add(() => {
      const t = this.camera.target;
      // Compute view direction from camera to target
      const viewDir = t.subtract(this.camera.position).normalize();
      // Put sun behind the camera, with a guaranteed downward component to bring it lower
      let sx = -viewDir.x - 4;
      let sy = -Math.abs(viewDir.y) - 0.5; // push downward to ~2-3pm feel
      let sz = -viewDir.z;
      const len = Math.hypot(sx, sy, sz) || 1;
      sx /= len;
      sy /= len;
      sz /= len;

      // Position along this direction at a fixed distance, looking at the target
      const pos = new Vector3(
        t.x - sx * followDistance,
        t.y - sy * followDistance,
        t.z - sz * followDistance,
      );
      sun.position.copyFrom(pos);
      sun.setDirectionToTarget(t);
    });

    return hemi;
  }

  private initMinimap(): ArcRotateCamera {
    // Top-down orthographic camera centered on the world
    const camera = new ArcRotateCamera(
      "minimapCamera",
      Math.PI / 2, // look North
      0.0001, // nearly top-down
      10,
      new Vector3(0, 0, 0),
      this.scene,
    );
    camera.mode = Camera.ORTHOGRAPHIC_CAMERA;

    // Lock rotation/tilt
    camera.lowerAlphaLimit = Math.PI / 2;
    camera.upperAlphaLimit = Math.PI / 2;
    camera.lowerBetaLimit = 0;
    camera.upperBetaLimit = 0;
    camera.panningSensibility = 0;

    // Cover the full world extents with a small margin
    const halfWidth = getWorldWidth(this.world.sizeX) / 2;
    const halfDepth = getWorldDepth(this.world.sizeY) / 2;
    camera.orthoLeft = -halfWidth;
    camera.orthoRight = halfWidth;
    camera.orthoBottom = -halfDepth;
    camera.orthoTop = halfDepth;

    // Do not attach controls; this camera is only for minimap capture
    return camera;
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

  private rebuildPipeline() {
    // Dispose previous
    if (this.pipeline) {
      this.pipeline.dispose();
      this.pipeline = undefined;
    }
    const useHdr = !!this.options.hdr;
    this.pipeline = new DefaultRenderingPipeline(
      "default",
      useHdr,
      this.scene,
      [this.camera], // Intentionally exclude minimap camera to keep it crisp and avoid post FX on the overview
    );
    // FXAA
    this.pipeline.fxaaEnabled = !!this.options.useFxaa;
    // Bloom
    this.pipeline.bloomEnabled = !!this.options.useBloom;
    if (this.pipeline.bloomEnabled) {
      if (typeof this.options.bloomThreshold === "number")
        this.pipeline.bloomThreshold = this.options.bloomThreshold;
      if (typeof this.options.bloomWeight === "number")
        this.pipeline.bloomWeight = this.options.bloomWeight;
    }
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
    if (
      prev.hdr !== this.options.hdr ||
      prev.useFxaa !== this.options.useFxaa ||
      prev.useBloom !== this.options.useBloom ||
      prev.bloomThreshold !== this.options.bloomThreshold ||
      prev.bloomWeight !== this.options.bloomWeight
    ) {
      this.rebuildPipeline();
    }
    if (prev.manualTilt !== this.options.manualTilt) {
      this.setManualTilt(!!this.options.manualTilt);
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
}
