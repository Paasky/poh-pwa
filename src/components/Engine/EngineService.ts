import type { WorldState } from "@/types/common";
import type { TransformNode } from "@babylonjs/core";
import {
  ArcRotateCamera,
  Engine as BabylonEngine,
  HemisphericLight,
  Matrix,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { buildTileGrid } from "@/components/Engine/meshes/tile"; /*
EngineService (concrete engine/scene/camera/loop owner)

Purpose
- Own BabylonJS Engine, Scene, Camera(s), and the main render loop.
- Provide a thin façade so UI/game logic don’t touch Babylon directly.

Notes on Engine.ts vs EngineService
- Engine.ts was a planning stub for the same responsibility (engine owner).
- This EngineService is the implemented, singleton version of that concept.
- We keep this file and remove Engine.ts to avoid duplication and confusion.
- If a non-singleton class is desired later, we can extract the logic into a
  class Engine and have EngineService wrap a single instance.

Public API
- init(world: WorldState): Promise<void>
- attach(container: HTMLElement): void
- detach(): void
- getScene(): Scene | null
- getEngine(): BabylonEngine | null
- getCanvas(): HTMLCanvasElement | null

Rules
- Visual-only responsibilities; no game rules or pathfinding here.
- Scene content assembly is delegated to SceneBuilder and other components.
*/

/*
EngineService (concrete engine/scene/camera/loop owner)

Purpose
- Own BabylonJS Engine, Scene, Camera(s), and the main render loop.
- Provide a thin façade so UI/game logic don’t touch Babylon directly.

Notes on Engine.ts vs EngineService
- Engine.ts was a planning stub for the same responsibility (engine owner).
- This EngineService is the implemented, singleton version of that concept.
- We keep this file and remove Engine.ts to avoid duplication and confusion.
- If a non-singleton class is desired later, we can extract the logic into a
  class Engine and have EngineService wrap a single instance.

Public API
- init(world: WorldState): Promise<void>
- attach(container: HTMLElement): void
- detach(): void
- getScene(): Scene | null
- getEngine(): BabylonEngine | null
- getCanvas(): HTMLCanvasElement | null

Rules
- Visual-only responsibilities; no game rules or pathfinding here.
- Scene content assembly is delegated to SceneBuilder and other components.
*/

// =============================
// Camera tuning constants (easy to adjust)
// =============================
// Rotation angles
export const angleHorizontal = Math.PI / 2; // azimuth (locked)
// Camera tilt per zoom level (beta). At max-in use a comfortable tilt; at max-out nearly top-down.
export const tiltAngleAtMaxIn = Math.PI / 3; // ~60° when fully zoomed in
export const tiltAngleAtMaxOut = 0.25; // radians (~14°) when fully zoomed out (almost top-down)

// Zoom configuration
export const maxZoomOutFactor = 0.7; // relative to world extent (smaller = closer)
export const startZoomPortion = 0.1; // of max-out distance (smaller = closer)
export const minZoomDistance = 6; // absolute closest distance

// Panning behavior
export const panSensitivityAtMaxIn = 160; // higher = slower
export const panSensitivityAtMaxOut = 11; // higher = slower
export const zoomWheelPrecisionAtMaxIn = 7; // higher = slower
export const zoomWheelPrecisionAtMaxOut = 1; // higher = slower
// Mouse button used for panning (0 = left, 1 = middle, 2 = right)
export const panMouseButton = 2;
// Extra boost for Z-axis pan near max zoom-in (multiplied after tilt compensation)
export const zPanBoostAtMaxIn = 64;
export const zPanBoostAtMaxOut = 1; // no extra boost when fully zoomed out

class _EngineService {
  // Headless/game state
  public world: WorldState | null = null;

  // Babylon rendering state
  private engine: BabylonEngine | null = null;
  private scene: Scene | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private camera: ArcRotateCamera | null = null;
  private tileRoot: TransformNode | null = null;
  private worldPeriodX: number = 0; // world repeat period on X (for wrap)
  // Custom ground-drag panning state
  private _panDragging = false;
  private _panLastGround: Vector3 | null = null;
  private _panHandlers: {
    down: (e: PointerEvent) => void;
    move: (e: PointerEvent) => void;
    up: (e: PointerEvent) => void;
    leave: (e: PointerEvent) => void;
  } | null = null;
  // Prevent context menu on right-click when panning
  private _panContextHandler: ((e: Event) => void) | null = null;

  private initialized = false;

  async init(world: WorldState): Promise<void> {
    if (this.initialized) return;
    this.world = world;
    this.initialized = true;
  }

  attach(container: HTMLElement): void {
    if (this.engine) return; // already attached

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.setAttribute("touch-action", "none");
    container.appendChild(canvas);
    this.canvas = canvas;

    // Create engine/scene
    const engine = new BabylonEngine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    const scene = new Scene(engine);
    this.engine = engine;
    this.scene = scene;

    // Camera and light
    this.initCamera(scene, canvas);

    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Build first visible prototype: hex tiles colored by domain (land/water)
    if (!this.world) throw new Error("EngineService.init() must be called before attach()");
    const grid = buildTileGrid(scene, this.world, { hexRadius: 1, replicateX: 3 });
    this.tileRoot = grid.root;
    this.worldPeriodX = grid.periodX;

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Initial resize
    engine.resize();

    // Hook resize
    window.addEventListener("resize", this.onResize);
  }

  // Configure and return the ArcRotateCamera (left-drag pans X/Z, no rotation, stepwise pan sensitivity)
  private initCamera(scene: Scene, canvas: HTMLCanvasElement): ArcRotateCamera {
    if (!this.world) throw new Error("EngineService.init() must be called before attach()");
    const cam = new ArcRotateCamera(
      "camera",
      angleHorizontal,
      tiltAngleAtMaxIn,
      10,
      Vector3.Zero(),
      scene,
    );
    cam.attachControl(canvas, true);

    // Lock rotation and set base interaction with no inertia (no assistance)
    cam.lowerAlphaLimit = cam.upperAlphaLimit = angleHorizontal;
    // beta (tilt) will be computed dynamically per zoom and locked each frame
    // Disable built-in panning; we implement ground-plane drag ourselves
    cam.panningMouseButton = -1;
    cam.useCtrlForPanning = false;
    cam.inertia = 0;
    cam.panningInertia = 0;
    // Prevent Babylon from using left mouse for rotation (avoid input conflict)
    try {
      // @ts-expect-error types vary by version
      cam.inputs.attached.pointers.buttons = [1, 2];
    } catch {
      /* ignore */
    }
    // wheelPrecision will be computed continuously based on zoom (see applyDynamics below)

    // Zoom limits and start zoom based on world extent
    const extent = Math.max(this.world.sizeX, this.world.sizeY);
    const maxOutR = Math.max(10, extent * maxZoomOutFactor);
    cam.lowerRadiusLimit = minZoomDistance;
    cam.upperRadiusLimit = maxOutR;
    cam.radius = Math.min(
      Math.max(maxOutR * startZoomPortion, cam.lowerRadiusLimit),
      cam.upperRadiusLimit,
    );
    cam.setTarget(Vector3.Zero());

    // Continuous pan sensitivity, wheel precision and tilt (beta) fitted to endpoints:
    // sens(r) = k / r^gamma
    const applyDynamics = () => {
      const rMin = cam.lowerRadiusLimit ?? minZoomDistance;
      const rMax = cam.upperRadiusLimit ?? maxOutR;
      // --- Panning sensibility ---
      const sMinPan = panSensitivityAtMaxIn; // at rMin (max zoom-in)
      const sMaxPan = panSensitivityAtMaxOut; // at rMax (max zoom-out)
      const gammaPan = Math.log(sMinPan / sMaxPan) / Math.log(rMax / rMin);
      const kPan = sMinPan * Math.pow(rMin, gammaPan);
      cam.panningSensibility = kPan / Math.pow(cam.radius, gammaPan);

      // --- Wheel precision (higher = slower) ---
      const sMinWheel = zoomWheelPrecisionAtMaxIn; // at rMin
      const sMaxWheel = zoomWheelPrecisionAtMaxOut; // at rMax
      const gammaWheel = Math.log(sMinWheel / sMaxWheel) / Math.log(rMax / rMin);
      const kWheel = sMinWheel * Math.pow(rMin, gammaWheel);
      cam.wheelPrecision = kWheel / Math.pow(cam.radius, gammaWheel);

      // --- Tilt (beta) per zoom ---
      const bMin = tiltAngleAtMaxIn; // at rMin (max zoom-in)
      const bMax = tiltAngleAtMaxOut; // at rMax (max zoom-out)
      const gammaTilt = Math.log(bMin / bMax) / Math.log(rMax / rMin);
      const kTilt = bMin * Math.pow(rMin, gammaTilt);
      const beta = kTilt / Math.pow(cam.radius, gammaTilt);
      const safeBeta = Math.min(Math.max(beta, 0.01), Math.PI - 0.01);
      cam.beta = safeBeta;
      cam.lowerBetaLimit = cam.upperBetaLimit = safeBeta; // keep rotation disabled
      // Keep target strictly on the ground plane to avoid any drift in Y
      if (cam.target.y !== 0) cam.target.y = 0;

      // --- Seamless horizontal wrap: recenter target across the X period ---
      if (this.worldPeriodX > 0) {
        const half = this.worldPeriodX / 2;
        let shifted = 0;
        if (cam.target.x > half) {
          cam.target.x -= this.worldPeriodX;
          shifted = -this.worldPeriodX;
        } else if (cam.target.x < -half) {
          cam.target.x += this.worldPeriodX;
          shifted = this.worldPeriodX;
        }
        // Keep panning continuity while dragging by shifting last ground point too
        if (shifted !== 0 && this._panLastGround) {
          this._panLastGround.x += shifted;
        }
      }
    };
    applyDynamics();
    scene.onBeforeRenderObservable.add(applyDynamics);

    // --- Ground-plane drag panning ---
    const groundAt = (clientX: number, clientY: number): Vector3 | null => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const ray = scene.createPickingRay(x, y, Matrix.IdentityReadOnly, cam);
      const oy = ray.origin.y;
      const dy = ray.direction.y;
      const EPS = 1e-6;
      if (Math.abs(dy) < EPS) return null;
      const t = -oy / dy;
      if (t < 0) return null;
      // p = o + d * t
      const px = ray.origin.x + ray.direction.x * t;
      const pz = ray.origin.z + ray.direction.z * t;
      return new Vector3(px, 0, pz);
    };

    const onDown = (e: PointerEvent) => {
      // Only react to configured panning button
      if (e.button !== panMouseButton) return;
      const gp = groundAt(e.clientX, e.clientY);
      if (!gp) return;
      this._panDragging = true;
      this._panLastGround = gp;
      try {
        (e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!this._panDragging || !this._panLastGround) return;
      const gp = groundAt(e.clientX, e.clientY);
      if (!gp) return;
      const delta = gp.subtract(this._panLastGround);
      // Ensure pure X/Z movement (lock Y)
      delta.y = 0;
      // Compensate Z movement by current tilt so vertical drags feel like horizontal
      // Factor grows as tilt approaches top-down (sin(beta) → 0), clamped to avoid extremes
      const sb = Math.sin(cam.beta);
      let zComp = 1 / Math.max(1e-3, sb);
      if (zComp < 1) zComp = 1; // never slow Z below X
      if (zComp > 4) zComp = 4; // cap to keep it stable near top-down
      // Apply additional zoom-dependent boost so Z feels snappier near max-in
      const rMinZ = cam.lowerRadiusLimit ?? minZoomDistance;
      const rMaxZ = cam.upperRadiusLimit ?? Math.max(rMinZ + 1, cam.radius);
      let zBoost = 1;
      if (rMaxZ > rMinZ && zPanBoostAtMaxIn > 0 && zPanBoostAtMaxOut > 0) {
        const gammaZ = Math.log(zPanBoostAtMaxIn / zPanBoostAtMaxOut) / Math.log(rMaxZ / rMinZ);
        const kZ = zPanBoostAtMaxIn * Math.pow(rMinZ, gammaZ);
        zBoost = kZ / Math.pow(cam.radius, gammaZ);
        // Clamp between configured endpoints for stability
        if (zBoost < Math.min(zPanBoostAtMaxIn, zPanBoostAtMaxOut))
          zBoost = Math.min(zPanBoostAtMaxIn, zPanBoostAtMaxOut);
        if (zBoost > Math.max(zPanBoostAtMaxIn, zPanBoostAtMaxOut))
          zBoost = Math.max(zPanBoostAtMaxIn, zPanBoostAtMaxOut);
      }
      delta.z *= zComp * zBoost;
      // Reuse the tuned panning sensibility to scale movement consistently
      // scale = 1 / sens
      const sens = cam.panningSensibility || 1;
      const scale = 1 / sens;
      cam.target.subtractInPlace(delta.scale(scale));
      cam.target.y = 0; // snap back to ground plane
      this._panLastGround = gp;
    };

    const endDrag = (e?: PointerEvent) => {
      this._panDragging = false;
      this._panLastGround = null;
      try {
        if (e) (e.currentTarget as HTMLElement)?.releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointerleave", endDrag);
    // Prevent context menu on right-click drags
    const onContext = (ev: Event) => ev.preventDefault();
    canvas.addEventListener("contextmenu", onContext);
    this._panContextHandler = onContext;
    this._panHandlers = { down: onDown, move: onMove, up: endDrag, leave: endDrag };

    this.camera = cam;

    return cam;
  }

  detach(): void {
    window.removeEventListener("resize", this.onResize);
    if (this.engine) {
      try {
        this.engine.stopRenderLoop();
      } catch {
        /* ignore */
      }
    }
    if (this.scene) {
      try {
        this.scene.dispose();
      } catch {
        /* ignore */
      }
    }
    if (this.engine) {
      try {
        this.engine.dispose();
      } catch {
        /* ignore */
      }
    }
    if (this.canvas && this.canvas.parentElement) {
      try {
        // Remove ground-drag handlers if present
        if (this._panHandlers && this.canvas) {
          this.canvas.removeEventListener("pointerdown", this._panHandlers.down);
          this.canvas.removeEventListener("pointermove", this._panHandlers.move);
          this.canvas.removeEventListener("pointerup", this._panHandlers.up);
          this.canvas.removeEventListener("pointerleave", this._panHandlers.leave);
        }
        this.canvas.parentElement.removeChild(this.canvas);
      } catch {
        /* ignore */
      }
    }
    this.canvas = null;
    this.scene = null;
    this.engine = null;
    this.tileRoot = null;
    this._panHandlers = null;
    this._panDragging = false;
    this._panLastGround = null;
  }

  // Accessors to match the planned Engine API
  getScene(): Scene | null {
    return this.scene;
  }

  getEngine(): BabylonEngine | null {
    return this.engine;
  }

  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  private onResize = () => {
    if (this.engine) this.engine.resize();
  };
}

export const EngineService = new _EngineService();
