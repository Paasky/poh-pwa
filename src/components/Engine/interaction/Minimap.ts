import {
  ArcRotateCamera,
  Camera,
  Engine as BabylonEngine,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { CreateScreenshotUsingRenderTarget } from "@babylonjs/core/Misc/screenshotTools";
import { TerrainMeshBuilder } from "@/factories/TerrainMeshBuilder/TerrainMeshBuilder";
import { useObjectsStore } from "@/stores/objectStore";
import {
  calculateMinimapCameraBounds,
  getFullWorldOrthoBounds,
  type OrthoBounds,
} from "@/helpers/math";
import { FogOfWar } from "@/components/Engine/FogOfWar";
import { Coords } from "@/helpers/mapTools";
import { rotNorth } from "@/components/Engine/interaction/MainCamera";

export class Minimap {
  /** Public bounds property used by external components (like Minimap.vue) */
  public bounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };

  private readonly _size: Coords;
  private readonly _canvas: HTMLCanvasElement;
  private readonly _engine: BabylonEngine;
  private readonly _scene: Scene;
  private readonly _camera: ArcRotateCamera;
  private readonly _light: HemisphericLight;
  private readonly _terrain: TerrainMeshBuilder;
  private readonly _fogOfWar: FogOfWar;
  private readonly _ctx: CanvasRenderingContext2D;

  private _captureTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    size: Coords,
    canvas: HTMLCanvasElement,
    engine: BabylonEngine,
    fogOfWar: FogOfWar,
    private getKnownBounds: () => OrthoBounds | null,
  ) {
    this._size = size;
    this._canvas = canvas;
    this._engine = engine;
    this._fogOfWar = fogOfWar;

    const context = this._canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2D context from minimap canvas");
    this._ctx = context;

    // Create an isolated, low-cost scene just for minimap capture
    this._scene = new Scene(this._engine);
    this._scene.autoClear = true;
    this._scene.fogEnabled = false;

    // Minimal ambient light for flat, readable colors (no shadows, no post FX)
    this._light = new HemisphericLight("minimapHemi", Vector3.Up(), this._scene);
    this._light.intensity = 0.7;

    // Top-down orthographic camera centered on the world
    this._camera = new ArcRotateCamera(
      "minimapCamera",
      rotNorth, // look North
      0.0001, // nearly top-down
      10,
      Vector3.Zero(),
      this._scene,
    );
    this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    this._fogOfWar.attachToCamera(this._camera);

    // Initial camera bounds (full world)
    this._applyCameraBounds(getFullWorldOrthoBounds(this._size));

    // Build a simple terrain for the minimap to capture
    this._terrain = new TerrainMeshBuilder(this._scene, this._size, useObjectsStore().getTiles, {
      hexRingCount: 1,
      lowDetail: true,
    });
  }

  private _applyCameraBounds(bounds: OrthoBounds) {
    this._camera.orthoLeft = bounds.left;
    this._camera.orthoRight = bounds.right;
    this._camera.orthoBottom = bounds.bottom;
    this._camera.orthoTop = bounds.top;
  }

  private triggerCapture() {
    if (this._captureTimeout) return;
    this._captureTimeout = setTimeout(() => {
      this.capture();
      this._captureTimeout = null;
    }, 150); // Delay by 150ms to catch "bursts" of movement
  }

  public capture(): void {
    const known = this.getKnownBounds() || getFullWorldOrthoBounds(this._size);
    const ortho = calculateMinimapCameraBounds(known, this._canvas.width, this._canvas.height);

    this._applyCameraBounds(ortho);

    // Update the public bounds property
    this.bounds = { minX: ortho.left, maxX: ortho.right, minZ: ortho.bottom, maxZ: ortho.top };

    const { width, height } = this._canvas;
    CreateScreenshotUsingRenderTarget(this._engine, this._camera, { width, height }, (data) => {
      if (this._camera.isDisposed()) return;

      const image = new Image();
      image.onload = () => {
        if (this._camera.isDisposed()) return;
        // 1. Clear background with black
        this._ctx.fillStyle = "#000";
        this._ctx.fillRect(0, 0, width, height);

        // 2. Draw the captured terrain
        this._ctx.drawImage(image, 0, 0);
      };
      image.src = data as string;
    });
  }

  public dispose(): void {
    // Only dispose things we created
    if (this._captureTimeout) {
      clearTimeout(this._captureTimeout);
      this._captureTimeout = null;
    }

    this._camera.dispose();
    this._light.dispose();
    this._terrain.dispose();
    this._scene.dispose();
  }
}
