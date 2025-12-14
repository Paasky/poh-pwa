import {
  ArcRotateCamera,
  ArcRotateCameraPointersInput,
  PointerEventTypes,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { Coords } from "@/helpers/mapTools";
import { getWorldMaxX, getWorldMinX, getWorldWidth } from "@/helpers/math";

export type MainCameraOptions = {
  panSpeed?: number;
  maxRotation?: number;
  maxTilt?: number;
  minTilt?: number;
  maxZoomIn?: number;
  maxZoomOut?: number;
  manualTilt?: boolean;
};

export const rot30 = Math.PI / 6;
export const rotNorth = -rot30 * 3;

export class MainCamera {
  readonly size: Coords;
  readonly scene: Scene;
  readonly canvas: HTMLCanvasElement;
  readonly camera: ArcRotateCamera;

  private _rotationInput = new ArcRotateCameraPointersInput();
  private _manualTiltEnabled = false;

  // Tunables (defaults mirror previous EngineService values)
  panSpeed: number;
  maxRotation: number;
  maxTilt: number;
  minTilt: number;
  maxZoomIn: number;
  maxZoomOut: number;

  constructor(size: Coords, scene: Scene, canvas: HTMLCanvasElement, opts?: MainCameraOptions) {
    this.size = size;
    this.scene = scene;
    this.canvas = canvas;

    this.panSpeed = opts?.panSpeed ?? 5;
    this.maxRotation = opts?.maxRotation ?? rot30;
    this.maxTilt = opts?.maxTilt ?? 0.8;
    this.minTilt = opts?.minTilt ?? 0.1;
    this.maxZoomIn = opts?.maxZoomIn ?? 10;
    this.maxZoomOut = opts?.maxZoomOut ?? 100;

    // Create camera
    this.camera = new ArcRotateCamera(
      "camera",
      rotNorth,
      this.maxTilt,
      this.maxZoomIn,
      new Vector3(0, 0, 0),
      this.scene,
    );

    // Controls
    this.camera.inputs.clear();
    this.camera.inputs.addMouseWheel();
    this.camera.wheelDeltaPercentage = 0.02;
    this.camera.useNaturalPinchZoom = true;
    this.camera.attachControl(this.canvas, true);
    this.camera.useAutoRotationBehavior = false;
    this._rotationInput.buttons = [1, 2];
    this._rotationInput.panningSensibility = 0;
    this.setManualTilt(!!opts?.manualTilt);

    // Left-button panning
    this.installPanning();

    // Limits
    this.camera.lowerAlphaLimit = rotNorth - this.maxRotation;
    this.camera.upperAlphaLimit = rotNorth + this.maxRotation;
    this.camera.upperBetaLimit = this.maxTilt;
    this.camera.lowerBetaLimit = this.minTilt;
    this.camera.lowerRadiusLimit = this.maxZoomIn;
    this.camera.upperRadiusLimit = this.maxZoomOut;

    // Wrap/clamp/autotilt each frame
    this.installViewMatrixObserver();
  }

  setManualTilt(enabled: boolean): void {
    if (enabled && !this._manualTiltEnabled) {
      this.camera.inputs.add(this._rotationInput);
      this._manualTiltEnabled = true;
    } else if (!enabled && this._manualTiltEnabled) {
      this.camera.inputs.remove(this._rotationInput);
      this._manualTiltEnabled = false;
    }
  }

  private installPanning(): void {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    this.scene.onPointerObservable.add((pi) => {
      const ev = pi.event as PointerEvent;
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        if (ev.button === 0) {
          dragging = true;
          lastX = ev.clientX;
          lastY = ev.clientY;
        }
      } else if (pi.type === PointerEventTypes.POINTERUP) {
        dragging = false;
      } else if (pi.type === PointerEventTypes.POINTERMOVE) {
        if (!dragging) return;
        const dx = ev.clientX - lastX;
        const dy = ev.clientY - lastY;
        lastX = ev.clientX;
        lastY = ev.clientY;
        const k = (this.panSpeed / 625) * (this.camera.radius / this.camera.lowerRadiusLimit!);
        this.camera.target.x -= dx * k;
        this.camera.target.z += dy * k;
      }
    });
  }

  private installViewMatrixObserver(): void {
    const worldWidth = getWorldWidth(this.size.x);
    const worldMinX = getWorldMinX(worldWidth);
    const worldMaxX = getWorldMaxX(worldWidth);

    this.camera.onViewMatrixChangedObservable.add(() => {
      const t = this.camera.target;

      // Default N/S clamp based on world rows
      const minZ = -this.size.y / 1.385;
      const maxZ = this.size.y / 1.425;
      t.z = Math.min(Math.max(t.z, minZ), maxZ);

      // Wrap X across world bounds
      if (t.x > worldMaxX) t.x -= worldWidth;
      else if (t.x < worldMinX) t.x += worldWidth;

      // Auto-tilt if manual tilt disabled
      if (!this._manualTiltEnabled) {
        const frac = (this.camera.radius - this.maxZoomIn) / (this.maxZoomOut - this.maxZoomIn);
        this.camera.beta = this.maxTilt - frac * (this.maxTilt - this.minTilt);
      }
    });
  }
}
