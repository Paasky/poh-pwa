import {
  ArcRotateCamera,
  Camera,
  Engine as BabylonEngine,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import type { WorldState } from "@/types/common";
import { CreateScreenshotUsingRenderTarget } from "@babylonjs/core/Misc/screenshotTools";
import { TerrainMeshBuilder } from "@/factories/TerrainMeshBuilder/TerrainMeshBuilder";
import { useObjectsStore } from "@/stores/objectStore";
import { getWorldDepth, getWorldWidth } from "@/helpers/math";
import { FogOfWar } from "@/components/Engine/FogOfWar";
import type { Tile } from "@/objects/game/Tile";
import type { GameKey } from "@/objects/game/_GameObject";
import { getNeighbors } from "@/helpers/mapTools";
import type { Unit } from "@/objects/game/Unit";

export class Minimap {
  world: WorldState;
  canvas: HTMLCanvasElement;
  engine: BabylonEngine;
  scene: Scene;
  camera: ArcRotateCamera;
  light: HemisphericLight;
  terrain: TerrainMeshBuilder;
  private fogOfWar?: FogOfWar;

  constructor(world: WorldState, canvas: HTMLCanvasElement, engine: BabylonEngine) {
    this.world = world;
    this.canvas = canvas;
    this.engine = engine;

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
    const halfWidth = getWorldWidth(this.world.sizeX) / 2;
    const halfDepth = getWorldDepth(this.world.sizeY) / 2;
    this.camera.orthoLeft = -halfWidth;
    this.camera.orthoRight = halfWidth;
    this.camera.orthoBottom = -halfDepth;
    this.camera.orthoTop = halfDepth;
    // No controls attached; this.camera is used only for one-off minimap capture

    // Build a simple terrain for the minimap to capture
    this.terrain = new TerrainMeshBuilder(
      this.scene,
      { x: this.world.sizeX, y: this.world.sizeY },
      useObjectsStore().getTiles,
      { hexRingCount: 1, lowDetail: true },
    );

    // Attach Fog of War to the minimap scene as well (mirrors main scene behavior)
    const tilesByKey = useObjectsStore().getTiles as Record<string, Tile>;
    const size = { x: this.world.sizeX, y: this.world.sizeY };
    const init = this.computeInitialFogFromUnits(tilesByKey);
    this.fogOfWar = new FogOfWar(this.scene, size, tilesByKey, init.knownKeys, init.visibleKeys);
    this.fogOfWar.setEnabled(true);
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
      const renderingContext2d = this.canvas.getContext("2d")!;
      const imageElement = new Image();
      imageElement.onload = () => {
        renderingContext2d.clearRect(0, 0, width, height);
        renderingContext2d.drawImage(imageElement, 0, 0, width, height);
      };
      imageElement.src = data as string;
    });
  }

  dispose(): void {
    this.fogOfWar?.dispose();
    // Dispose scene resources created for minimap
    this.terrain.dispose();
    this.light.dispose();
    this.scene.dispose();
  }

  // --- Fog of War mirroring API ---
  addKnownTiles(tiles: Tile[]): void {
    this.fogOfWar?.addKnownTiles(tiles);
  }

  setVisibleTiles(tiles: Tile[]): void {
    this.fogOfWar?.setVisibleTiles(tiles);
  }

  updateFogVisibility(visibleKeys: Iterable<GameKey>, changedKeys?: GameKey[]): void {
    this.fogOfWar?.updateFromVisibility(visibleKeys, changedKeys);
  }

  // --- FoW helper (mirrors EngineService behavior) ---
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

      // Known: include visible and ring at distance 2
      known.add(tile.key as GameKey);
      for (const t of v1) known.add(t.key as GameKey);
      const k2 = getNeighbors(size, tile, tilesByKey, "hex", 2);
      for (const t of k2) known.add(t.key as GameKey);
    }

    return { knownKeys: Array.from(known), visibleKeys: Array.from(visible) };
  }
}
