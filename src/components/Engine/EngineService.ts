import { Color4, Engine as BabylonEngine, Observer, Scalar, Scene, Vector3 } from "@babylonjs/core";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import {
  calculateKnownBounds,
  clampCoordsToBoundaries,
  getEngineCoordsFromPercent,
  type OrthoBounds,
  tileCenter,
} from "@/helpers/math";
import { TerrainMeshBuilder } from "@/factories/TerrainMeshBuilder/TerrainMeshBuilder";
import { useObjectsStore } from "@/stores/objectStore";
import { EnvironmentService } from "@/components/Engine/EnvironmentService";
import LogicMeshBuilder from "@/factories/LogicMeshBuilder";
import { Minimap } from "@/components/Engine/interaction/Minimap";
import { MainCamera } from "@/components/Engine/interaction/MainCamera";
import FeatureInstancer from "@/components/Engine/features/FeatureInstancer";
import { FogOfWar } from "@/components/Engine/FogOfWar";
import GridOverlay from "@/components/Engine/overlays/GridOverlay";
import type { Tile } from "@/objects/game/Tile";
import type { GameKey } from "@/objects/game/_GameObject";
import { Coords, getCoordsFromTileKey } from "@/helpers/mapTools";
import { EngineCoords } from "@/factories/TerrainMeshBuilder/_terrainMeshTypes";
import { useSettingsStore } from "@/stores/settingsStore";
import { watch } from "vue";
import { useCurrentTile } from "@/stores/currentTile";

// noinspection JSUnusedGlobalSymbols
export class EngineService {
  size: Coords;
  canvas: HTMLCanvasElement;
  engine!: BabylonEngine;
  scene!: Scene;

  mainCamera!: MainCamera;
  environmentService!: EnvironmentService;
  terrainBuilder!: TerrainMeshBuilder;
  logicMesh!: LogicMeshBuilder;
  featureInstancer!: FeatureInstancer;
  fogOfWar!: FogOfWar;
  gridOverlay!: GridOverlay;

  minimapCanvas?: HTMLCanvasElement;
  minimap?: Minimap;

  private _knownBounds: OrthoBounds | null = null;
  private flyToObserver: Observer<Scene> | null = null;

  constructor(size: Coords, canvas: HTMLCanvasElement, minimapCanvas?: HTMLCanvasElement) {
    // Prevent strange bugs from happening
    if (size.x <= 0 || size.y <= 0) throw new Error("Invalid map size");

    this.size = size;
    this.canvas = canvas;
    this.canvas.addEventListener("pointerleave", this.onCanvasLeave);

    this.minimapCanvas = minimapCanvas;
  }

  private onCanvasLeave = (): void => {
    useCurrentTile().hoveredTile.value = undefined;
  };

  initEngineAndScene(): this {
    const settings = useSettingsStore().engineSettings;

    this.engine = new BabylonEngine(
      this.canvas,
      settings.antialias,
      {
        preserveDrawingBuffer: settings.preserveDrawingBuffer,
        stencil: settings.stencil,
        disableWebGL2Support: settings.disableWebGL2Support,
        powerPreference: settings.powerPreference,
      },
      settings.adaptToDeviceRatio,
    );
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.63, 0.63, 0.63, 1); // Same-ish as snow

    // Allow for easy debugging
    // eslint-disable-next-line
    (document as any).engineService = this;

    // Watch for non-restart settings changes
    this.applyRenderScale(settings.renderScale);
    watch(
      () => settings.renderScale,
      (newScale) => this.applyRenderScale(newScale),
    );

    return this;
  }

  initCamera(): this {
    this.mainCamera = new MainCamera(
      this.size,
      this.scene,
      this.canvas,
      this.fogOfWar,
      this.gridOverlay,
      () => this.knownBounds,
    );

    this.flyToCurrentPlayer(true);

    return this;
  }

  initEnvironment(): this {
    this.environmentService = new EnvironmentService(this.scene, this.mainCamera.camera);

    return this;
  }

  initLogic(): this {
    this.logicMesh = new LogicMeshBuilder(this.scene, this.size, useObjectsStore().getTiles);

    const { hoveredTile, selectedTile, contextTile } = useCurrentTile();
    this.logicMesh.onTileHover((tile) => (hoveredTile.value = tile));
    this.logicMesh.onTileExit(() => (hoveredTile.value = undefined));
    this.logicMesh.onTilePick((tile) => {
      selectedTile.value = tile;
      contextTile.value = undefined;
    });
    this.logicMesh.onTileContextMenu((tile) => (contextTile.value = tile));

    return this;
  }

  initTerrain(): this {
    this.terrainBuilder = new TerrainMeshBuilder(this.scene, this.size, useObjectsStore().getTiles);

    return this;
  }

  initGridOverlay(): this {
    this.gridOverlay = new GridOverlay(this.scene, this.size, useObjectsStore().getTiles);

    return this;
  }

  initFeatures(): this {
    this.featureInstancer = new FeatureInstancer(
      this.scene,
      this.size,
      Object.values(useObjectsStore().getTiles),
      this.terrainBuilder.root,
    );

    return this;
  }

  initFogOfWar(): this {
    this.fogOfWar = new FogOfWar(this.size, this.scene);

    // Watch for known area changes to update clamping bounds
    const player = useObjectsStore().currentPlayer;
    watch(
      player.knownTileKeys,
      (keys) => {
        this._knownBounds = calculateKnownBounds(this.size, keys);
        // Trigger minimap update if it exists
        if (this.minimap) this.minimap.capture();
      },
      { immediate: true },
    );

    return this;
  }

  public get knownBounds(): OrthoBounds | null {
    return this._knownBounds;
  }

  render(): this {
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // Resize to window
    this.engine.resize();
    window.addEventListener("resize", this.onResize);

    return this;
  }

  initMinimap(): this {
    if (this.minimapCanvas) {
      this.minimap = new Minimap(
        this.size,
        this.minimapCanvas,
        this.engine,
        this.fogOfWar,
        () => this.knownBounds,
      );
      this.minimap.capture();
    }

    return this;
  }

  initOrder(): (() => void)[] {
    return [
      // All components require the engine/scene
      () => this.initEngineAndScene(),

      // No other requirements
      () => this.initFogOfWar(),
      () => this.initGridOverlay(),
      () => this.initLogic(),
      () => this.initTerrain(),

      // Requires FogOfWar & GridOverlay
      () => this.initCamera(),

      // Requires Terrain
      () => this.initFeatures(),

      // Requires Camera
      () => this.initEnvironment(),

      // Start Rendering!
      () => this.render(),

      // Optional minimap (if canvas was given)
      () => this.initMinimap(),
    ];
  }

  init(): this {
    this.initOrder().forEach((fn) => fn());
    return this;
  }

  dispose(): void {
    // Stop flying
    this.stopFlying();

    // Optional minimap
    if (this.minimap) this.minimap.dispose();

    // Stop rendering
    window.removeEventListener("resize", this.onResize);
    this.engine.stopRenderLoop();

    // Stop requires camera
    this.environmentService.dispose();
    this.fogOfWar.dispose();

    // Stop requires terrain
    this.featureInstancer.dispose();

    // Stop requires GridOverlay
    this.mainCamera.camera.dispose();

    // Stop others
    this.gridOverlay.dispose();
    this.logicMesh.dispose();
    this.terrainBuilder.dispose();

    // Finally, stop the scene & engine
    this.canvas.removeEventListener("pointerleave", this.onCanvasLeave);
    this.scene.dispose();
    this.engine.dispose();
  }

  flyTo(coords: EngineCoords, teleport = false): EngineService {
    const clamped = clampCoordsToBoundaries(coords, this.size, this._knownBounds);
    const targetPos = new Vector3(clamped.x, 0, clamped.z);

    // Remove any existing flyTo observer
    this.stopFlying();

    if (teleport) {
      this.mainCamera.camera.target.copyFrom(targetPos);
      return this;
    }

    const startPos = this.mainCamera.camera.target.clone();
    const duration = 0.5;
    let elapsed = 0;

    this.flyToObserver = this.scene.onBeforeRenderObservable.add(() => {
      const deltaTime = this.engine.getDeltaTime() / 1000;
      elapsed += deltaTime;

      // 1. Calculate linear completion (0 to 1)
      const completion = Scalar.Clamp(elapsed / duration, 0, 1);

      // 2. Apply SmoothStep to get the "speed up, then speed down" effect
      // This creates the organic acceleration/deceleration curve
      const easedCompletion = Scalar.SmoothStep(0, 1, completion);

      // 3. Use the eased value for position interpolation
      Vector3.LerpToRef(startPos, targetPos, easedCompletion, this.mainCamera.camera.target);

      if (completion >= 1) {
        this.stopFlying();
      }
    });

    return this;
  }

  flyToCurrentPlayer(teleport = false): void {
    const currentPlayer = useObjectsStore().currentPlayer;

    // Unit has priority
    const unit = currentPlayer.units.value[0];
    if (unit) {
      this.flyToTile(unit.tileKey.value, teleport);
      return;
    }

    // Then capital
    const capital = currentPlayer.cities.value.find((city) => city.isCapital);
    if (capital) {
      this.flyToTile(capital.tileKey, teleport);
      return;
    }
  }

  // Public: move instantly to a percentage of world width/depth (0..1 each)
  flyToPercent(xPercent: number, yPercent: number, teleport = false): EngineService {
    return this.flyTo(getEngineCoordsFromPercent(this.size, xPercent, yPercent), teleport);
  }

  flyToTile(tile: GameKey | string | Tile, teleport = false): EngineService {
    if (typeof tile === "string") {
      const coords = getCoordsFromTileKey(tile as GameKey);
      return this.flyTo(tileCenter(this.size, coords), teleport);
    } else {
      return this.flyTo(tileCenter(this.size, tile), teleport);
    }
  }

  stopFlying(): this {
    if (this.flyToObserver) {
      this.scene.onBeforeRenderObservable.remove(this.flyToObserver);
      this.flyToObserver = null;
    }

    return this;
  }

  private onResize = () => {
    this.engine.resize();
  };

  private applyRenderScale(renderScale: number) {
    const safeScale = Math.max(0.25, Math.min(2, renderScale || 1));
    const hardwareScalingLevel = 1 / safeScale;
    this.engine.setHardwareScalingLevel(hardwareScalingLevel);
  }
}
