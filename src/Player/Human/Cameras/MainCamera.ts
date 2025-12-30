import {
  ArcRotateCamera,
  ArcRotateCameraPointersInput,
  PointerEventTypes,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { watch } from "vue";
import { useSettingsStore } from "@/stores/settingsStore";
import { Coords } from "@/helpers/mapTools";
import { clamp, clampCoordsToBoundaries, type OrthoBounds } from "@/helpers/math";
import GridOverlay from "@/Player/Human/Overlays/GridOverlay";
import { ContextOverlay } from "@/Player/Human/Overlays/ContextOverlay";
import { PathOverlay } from "@/Player/Human/Overlays/PathOverlay";
import { GuidanceOverlay } from "@/Player/Human/Overlays/GuidanceOverlay";
import { DetailOverlay } from "@/Player/Human/Overlays/DetailOverlay";
import { EngineLayers } from "@/Player/Human/EngineStyles";

export const rot30 = Math.PI / 6;
export const rotNorth = -rot30 * 3;

export class MainCamera {
  readonly size: Coords;
  readonly scene: Scene;
  readonly canvas: HTMLCanvasElement;
  readonly camera: ArcRotateCamera;
  readonly contextOverlay: ContextOverlay;
  readonly gridOverlay: GridOverlay;
  readonly guidanceOverlay: GuidanceOverlay;
  readonly detailOverlay: DetailOverlay;
  readonly pathOverlay: PathOverlay;
  private readonly getKnownBounds: () => OrthoBounds | null;

  private readonly _rotationInput = new ArcRotateCameraPointersInput();
  private _manualTiltEnabled = false;

  panSpeed: number = 5;
  maxRotation: number = rot30;
  maxTilt: number = 0.8;
  minTilt: number = 0.1;
  maxZoomIn: number = 10;
  maxZoomOut: number = 100;

  constructor(
    size: Coords,
    scene: Scene,
    canvas: HTMLCanvasElement,
    getKnownBounds: () => OrthoBounds | null,
    contextOverlay: ContextOverlay,
    gridOverlay: GridOverlay,
    guidanceOverlay: GuidanceOverlay,
    detailOverlay: DetailOverlay,
    pathOverlay: PathOverlay,
  ) {
    this.size = size;
    this.scene = scene;
    this.canvas = canvas;
    this.getKnownBounds = getKnownBounds;
    this.contextOverlay = contextOverlay;
    this.gridOverlay = gridOverlay;
    this.guidanceOverlay = guidanceOverlay;
    this.detailOverlay = detailOverlay;
    this.pathOverlay = pathOverlay;

    // Create camera
    this.camera = new ArcRotateCamera(
      "camera",
      rotNorth,
      this.maxTilt,
      this.maxZoomIn,
      new Vector3(0, 0, 0),
      this.scene,
    );
    this.contextOverlay.attachToCamera(this.camera);

    // Controls
    this.camera.inputs.clear();
    this.camera.inputs.addMouseWheel();
    this.camera.wheelDeltaPercentage = 0.02;
    this.camera.useNaturalPinchZoom = true;
    this.camera.attachControl(this.canvas, true);
    this.camera.useAutoRotationBehavior = false;
    this._rotationInput.buttons = [1, 2];
    this._rotationInput.panningSensibility = 0;

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

    const settings = useSettingsStore();
    this.setManualTilt(settings.engineSettings.manualTilt);
    watch(
      () => settings.engineSettings.manualTilt,
      (enabled) => this.setManualTilt(enabled),
    );
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

  private applyZoomEffects(): void {
    const lower = this.camera.lowerRadiusLimit ?? 10;
    const upper = this.camera.upperRadiusLimit ?? 100;
    const denom = Math.max(0.0001, upper - lower);
    const r = this.camera.radius;
    const norm = clamp((upper - r) / denom, 0, 1);

    // Auto-tilt if manual tilt disabled
    if (!this._manualTiltEnabled) {
      this.camera.beta = this.maxTilt - (1 - norm) * (this.maxTilt - this.minTilt);
    }

    // Grid thickness scaling: 0.25x at max out -> 1.5x at max in
    const thicknessScale = 0.25 + norm * 1.25;
    this.gridOverlay.setThicknessScale(thicknessScale);

    // Marker LOD: Hide small labels when zoomed out > 70%
    const showDetailMarkers = norm > 0.3;
    this.detailOverlay.showLayer(EngineLayers.movementCosts, showDetailMarkers);
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
    this.camera.onViewMatrixChangedObservable.add(() => {
      const bounds = this.getKnownBounds();
      const clamped = clampCoordsToBoundaries(this.camera.target, this.size, bounds);
      this.camera.target.x = clamped.x;
      this.camera.target.z = clamped.z;

      this.applyZoomEffects();
    });
  }
}
