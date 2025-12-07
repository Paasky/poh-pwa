import type { WorldState } from "@/types/common";
import type { TransformNode } from "@babylonjs/core";
import {
  ArcRotateCamera,
  ArcRotateCameraPointersInput,
  Color4,
  Engine as BabylonEngine,
  HemisphericLight,
  PointerEventTypes,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { buildTileGrid } from "@/components/Engine/meshes/tile";
import { getWorldMaxX, getWorldMinX, getWorldWidth } from "@/components/Engine/math";

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
  camera: ArcRotateCamera;
  light: HemisphericLight;
  tileRoot: TransformNode;

  constructor(world: WorldState, canvas: HTMLCanvasElement) {
    this.world = world;
    this.canvas = canvas;

    // Create Engine and Scene
    this.engine = new BabylonEngine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.63, 0.63, 0.63, 1); // Same-ish as snow

    // Create Camera and Light
    this.camera = this.initCamera(this.scene, this.canvas);
    this.light = this.initLight(this.scene);

    // Init Tiles
    this.tileRoot = buildTileGrid(this.scene, this.world).root;

    // Render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // Resize to window
    this.engine.resize();
    window.addEventListener("resize", this.onResize);
  }

  private initCamera(scene: Scene, canvas: HTMLCanvasElement): ArcRotateCamera {
    if (!this.world) throw new Error("EngineService.init() must be called before attach()");

    // Create Camera at the World center with max zoom in
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2, // Look North
      this.maxTilt, // Full Tilt
      this.maxZoomIn, // Zoomed in
      new Vector3(0, 0, 0),
      scene,
    );

    // Controls (clear all, then add back the ones we want)
    camera.inputs.clear();

    // a) Zoom Control from the mouse wheel
    camera.inputs.addMouseWheel();
    camera.wheelDeltaPercentage = 0.02;
    camera.useNaturalPinchZoom = true;

    // b) Rotation Control from the mouse right and middle buttons
    const rot = new ArcRotateCameraPointersInput();
    rot.buttons = [1, 2]; // 1=right, 2=middle
    rot.panningSensibility = 0;
    camera.inputs.add(rot);
    camera.attachControl(canvas, true);
    camera.useAutoRotationBehavior = false;

    // c) Panning Control from the mouse left button
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    scene.onPointerObservable.add((pi) => {
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
      t.z = Math.min(Math.max(t.z, -this.world!.sizeY / 1.385), this.world!.sizeY / 1.425);

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

  private initLight(scene: Scene): HemisphericLight {
    return new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  }

  detach(): void {
    window.removeEventListener("resize", this.onResize);
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }

  private onResize = () => {
    this.engine.resize();
  };
}
