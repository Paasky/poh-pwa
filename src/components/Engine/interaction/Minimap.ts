import {
  ArcRotateCamera,
  Camera,
  Engine as BabylonEngine,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { watch } from "vue";
import { CreateScreenshotUsingRenderTarget } from "@babylonjs/core/Misc/screenshotTools";
import { TerrainMeshBuilder } from "@/factories/TerrainMeshBuilder/TerrainMeshBuilder";
import { useObjectsStore } from "@/stores/objectStore";
import { getWorldDepth, getWorldWidth, hexDepth, hexWidth, tileCenter } from "@/helpers/math";
import { FogOfWar } from "@/components/Engine/FogOfWar";
import { Coords, getCoordsFromTileKey } from "@/helpers/mapTools";
import { rotNorth } from "@/components/Engine/interaction/MainCamera";

export class Minimap {
  size: Coords;
  canvas: HTMLCanvasElement;
  engine: BabylonEngine;
  scene: Scene;
  camera: ArcRotateCamera;
  light: HemisphericLight;
  terrain: TerrainMeshBuilder;
  fogOfWar: FogOfWar;
  bounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };

  private _captureTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(size: Coords, canvas: HTMLCanvasElement, engine: BabylonEngine, fogOfWar: FogOfWar) {
    this.size = size;
    this.canvas = canvas;
    this.engine = engine;
    this.fogOfWar = fogOfWar;

    // Create an isolated, low-cost scene just for minimap capture
    this.scene = new Scene(this.engine);
    this.scene.autoClear = true;
    this.scene.fogEnabled = false;

    // Minimal ambient light for flat, readable colors (no shadows, no post FX)
    this.light = new HemisphericLight("minimapHemi", new Vector3(0, 1, 0), this.scene);
    this.light.intensity = 0.7;

    // Top-down orthographic camera centered on the world
    this.camera = new ArcRotateCamera(
      "minimapCamera",
      rotNorth, // look North
      0.0001, // nearly top-down
      10,
      new Vector3(0, 0, 0),
      this.scene,
    );
    this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    this.fogOfWar.attachToCamera(this.camera);

    // Cover the full world extents with a small margin
    const halfWidth = getWorldWidth(this.size.x) / 2;
    const halfDepth = getWorldDepth(this.size.y) / 2;
    this.camera.orthoLeft = -halfWidth;
    this.camera.orthoRight = halfWidth;
    this.camera.orthoBottom = -halfDepth;
    this.camera.orthoTop = halfDepth;

    // Build a simple terrain for the minimap to capture
    this.terrain = new TerrainMeshBuilder(this.scene, this.size, useObjectsStore().getTiles, {
      hexRingCount: 1,
      lowDetail: true,
    });

    watch(
      () => useObjectsStore().currentPlayer.knownTileKeys,
      () => {
        this.triggerCapture();
      },
      { deep: true },
    );
  }

  private triggerCapture() {
    if (this._captureTimeout) return;
    this._captureTimeout = setTimeout(() => {
      this.capture();
      this._captureTimeout = null;
    }, 150); // Delay by 150ms to catch "bursts" of movement
  }

  capture(): void {
    // 1. Calculate Bounds
    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    const minTileHeight = 12;
    const minWorldHeight = minTileHeight * hexDepth;

    if (this.fogOfWar.knownKeys.size > 0) {
      for (const key of this.fogOfWar.knownKeys) {
        const { x, z } = tileCenter(this.size, getCoordsFromTileKey(key));
        minX = Math.min(minX, x - hexWidth / 2);
        maxX = Math.max(maxX, x + hexWidth / 2);
        minZ = Math.min(minZ, z - hexDepth / 2);
        maxZ = Math.max(maxZ, z + hexDepth / 2);
      }
    } else {
      // Fallback to center if nothing is known
      minX = -10;
      maxX = 10;
      minZ = -10;
      maxZ = 10;
    }

    // Ensure minimum height
    const currentHeight = maxZ - minZ;
    if (currentHeight < minWorldHeight) {
      const diff = (minWorldHeight - currentHeight) / 2;
      minZ -= diff;
      maxZ += diff;
    }

    // Adjust width to match canvas aspect ratio
    const targetRatio = this.canvas.width / this.canvas.height;
    const currentWidth = maxX - minX;
    const actualHeight = maxZ - minZ;
    const currentRatio = currentWidth / actualHeight;

    if (currentRatio < targetRatio) {
      const diff = (actualHeight * targetRatio - currentWidth) / 2;
      minX -= diff;
      maxX += diff;
    } else {
      const diff = (currentWidth / targetRatio - actualHeight) / 2;
      minZ -= diff;
      maxZ += diff;
    }

    this.camera.orthoLeft = minX;
    this.camera.orthoRight = maxX;
    this.camera.orthoBottom = minZ;
    this.camera.orthoTop = maxZ;

    // Update the public bounds property
    this.bounds = { minX, maxX, minZ, maxZ };

    const { width, height } = this.canvas;
    CreateScreenshotUsingRenderTarget(this.engine, this.camera, { width, height }, (data) => {
      const ctx = this.canvas.getContext("2d")!;
      const img = new Image();
      img.onload = () => {
        // 1. Clear background with black
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);

        // 2. Draw the captured terrain
        ctx.drawImage(img, 0, 0);
      };
      img.src = data as string;
    });
  }

  dispose(): void {
    // Only dispose things we created
    this.camera.dispose();
    this.light.dispose();
    this.terrain.dispose();
  }
}
