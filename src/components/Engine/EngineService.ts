import type { WorldState } from "@/types/common";
import {
  ArcRotateCamera,
  ArcRotateCameraPointersInput,
  Camera,
  Color4,
  Engine as BabylonEngine,
  HemisphericLight,
  PointerEventTypes,
  Scene,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { CreateScreenshotUsingRenderTarget } from "@babylonjs/core/Misc/screenshotTools";
import { TerrainMeshBuilder } from "@/components/Engine/terrain/TerrainMeshBuilder";
import {
  clamp,
  getWorldDepth,
  getWorldMaxX,
  getWorldMinX,
  getWorldMinZ,
  getWorldWidth,
} from "@/components/Engine/math";

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
  minimapCanvas: HTMLCanvasElement;

  camera: ArcRotateCamera;
  minimapCamera: ArcRotateCamera;
  light: HemisphericLight;
  tileRoot: TransformNode;
  terrainBuilder: TerrainMeshBuilder;

  // No animation state needed for simple, instant flyTo

  constructor(world: WorldState, canvas: HTMLCanvasElement, minimapCanvas: HTMLCanvasElement) {
    this.world = world;
    this.canvas = canvas;
    this.minimapCanvas = minimapCanvas;

    // Create Engine and Scene
    this.engine = new BabylonEngine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.63, 0.63, 0.63, 1); // Same-ish as snow

    // Create Cameras and Light
    this.camera = this.initCamera();
    this.minimapCamera = this.initMinimap();
    this.light = this.initLight();

    // Build merged terrain mesh (new pipeline)
    this.terrainBuilder = new TerrainMeshBuilder(this.scene, this.world, {
      hexRadius: 1,
      smoothing: 0.6,
      jitter: 0.04,
    });
    this.tileRoot = this.terrainBuilder.build();

    // Once the scene is ready, capture a one-time minimap image into the minimap canvas
    this.scene.executeWhenReady(() => {
      this.captureMinimap();
    });

    // Render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // Resize to window
    this.engine.resize();
    window.addEventListener("resize", this.onResize);
  }

  captureMinimap(): EngineService {
    // Render a 512x256 screenshot using the orthographic minimap camera and draw it to the canvas
    const width = 512;
    const height = 256;

    CreateScreenshotUsingRenderTarget(
      this.engine,
      this.minimapCamera,
      { width, height },
      (data) => {
        const ctx = this.minimapCanvas.getContext("2d");
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

    // Controls (clear all, then add back the ones we want)
    camera.inputs.clear();

    // a) Zoom Control from the mouse wheel
    camera.inputs.addMouseWheel();
    camera.wheelDeltaPercentage = 0.02;
    camera.useNaturalPinchZoom = true;

    // b) Rotation Control from the mouse right and middle buttons
    const rot = new ArcRotateCameraPointersInput();
    camera.attachControl(this.canvas, true);
    camera.useAutoRotationBehavior = false;
    if (this.manualTilt) {
      rot.buttons = [1, 2]; // 1=right, 2=middle
      rot.panningSensibility = 0;
      camera.inputs.add(rot);
    }

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
      if (!this.manualTilt) {
        const frac = (camera.radius - this.maxZoomIn) / (this.maxZoomOut - this.maxZoomIn);
        camera.beta = this.maxTilt - frac * (this.maxTilt - this.minTilt);
      }
    });

    this.camera = camera;
    return camera;
  }

  private initLight(): HemisphericLight {
    return new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
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
}
