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
  getWorldDepth,
  getWorldMinX,
  getWorldMinZ,
  getWorldWidth,
  hexDepth,
  hexWidth,
} from "@/helpers/math";
import { FogOfWar } from "@/components/Engine/FogOfWar";
import { Coords } from "@/helpers/mapTools";
import { Tile } from "@/objects/game/Tile";

export class Minimap {
  size: Coords;
  canvas: HTMLCanvasElement;
  engine: BabylonEngine;
  scene: Scene;
  camera: ArcRotateCamera;
  light: HemisphericLight;
  terrain: TerrainMeshBuilder;
  fogOfWar: FogOfWar;

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
      Math.PI / 2, // look North
      0.0001, // nearly top-down
      10,
      new Vector3(0, 0, 0),
      this.scene,
    );
    this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA;

    // Lock rotation/tilt
    this.camera.lowerAlphaLimit = Math.PI / 2;
    this.camera.upperAlphaLimit = Math.PI / 2;
    this.camera.lowerBetaLimit = 0;
    this.camera.upperBetaLimit = 0;
    this.camera.panningSensibility = 0;

    // Cover the full world extents with a small margin
    const halfWidth = getWorldWidth(this.size.x) / 2;
    const halfDepth = getWorldDepth(this.size.y) / 2;
    this.camera.orthoLeft = -halfWidth;
    this.camera.orthoRight = halfWidth;
    this.camera.orthoBottom = -halfDepth;
    this.camera.orthoTop = halfDepth;
    // No controls attached; this.camera is used only for one-off minimap capture

    // Build a simple terrain for the minimap to capture
    this.terrain = new TerrainMeshBuilder(this.scene, this.size, useObjectsStore().getTiles, {
      hexRingCount: 1,
      lowDetail: true,
    });
  }

  capture(): void {
    // Render a 512x256 screenshot using the orthographic minimap camera and draw it to the canvas.
    // For consistency, render with neutral, temporary lights and no fog so the minimap
    // is not affected by the current world environment (time of day, weather, fog, post FX).
    const width = 512;
    const height = 256;

    // Perform capture
    CreateScreenshotUsingRenderTarget(this.engine, this.camera, { width, height }, (data) => {
      // Draw into the minimap canvas
      const ctx = this.canvas.getContext("2d")!;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // KISS overlay: cover unknown tiles with simple black rectangles.
        // Compute world-to-pixel mapping once.
        const worldW = getWorldWidth(this.size.x);
        const worldD = getWorldDepth(this.size.y);
        const minX = getWorldMinX(worldW);
        const minZ = getWorldMinZ(worldD);

        // Rectangle size approximates hex bounds in pixels
        const rectW = (hexWidth / worldW) * width;
        const rectH = (hexDepth / worldD) * height;

        ctx.fillStyle = "#000";
        for (let y = 0; y < this.size.y; y++) {
          for (let x = 0; x < this.size.x; x++) {
            const key = Tile.getKey(x, y);
            if (!this.fogOfWar.knownKeys.has(key)) {
              // Odd-r pointy-top layout center in world units
              const wx = minX + hexWidth * (x + 0.5 * (y & 1));
              const wz = minZ + hexDepth * y;

              // Map world -> pixel
              const px = ((wx - minX) / worldW) * width;
              const py = ((wz - minZ) / worldD) * height;

              // Cover with a simple rectangle (good enough for 512x256 minimap)
              ctx.fillRect(px - rectW / 2, py - rectH / 2, rectW, rectH);
            }
          }
        }
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
