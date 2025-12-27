import { Color4, Engine as BabylonEngine, Observer, Scalar, Scene, Vector3 } from "@babylonjs/core";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import {
  calculateKnownBounds,
  clampCoordsToBoundaries,
  getEngineCoordsFromPercent,
  type OrthoBounds,
  tileCenter,
} from "@/helpers/math";
import { TerrainMesh } from "@/engine/TerrainMesh/TerrainMesh";
import { useObjectsStore } from "@/stores/objectStore";
import { Environment } from "@/engine/environment/Environment";
import LogicMesh from "@/engine/LogicMesh";
import { Minimap } from "@/engine/cameras/Minimap";
import { MainCamera } from "@/engine/cameras/MainCamera";
import FeatureInstancer from "@/engine/instancers/FeatureInstancer";
import GridOverlay from "@/engine/overlays/GridOverlay";
import { ObjectInstancer } from "@/engine/instancers/ObjectInstancer";
import type { Tile } from "@/objects/game/Tile";
import type { Unit } from "@/objects/game/Unit";
import type { Construction } from "@/objects/game/Construction";
import type { GameKey } from "@/objects/game/_GameObject";
import { Coords, getCoordsFromTileKey } from "@/helpers/mapTools";
import { EngineCoords } from "@/engine/TerrainMesh/_terrainMeshTypes";
import { useCurrentContext } from "@/composables/useCurrentContext";
import { Pathfinder } from "@/movement/Pathfinder";
import { useSettingsStore } from "@/stores/settingsStore";
import { watch } from "vue";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { ContextOverlay } from "@/engine/overlays/ContextOverlay";
import { PathOverlay } from "@/engine/overlays/PathOverlay";
import { GuidanceOverlay } from "@/engine/overlays/GuidanceOverlay";
import { DetailOverlay } from "@/engine/overlays/DetailOverlay";

// noinspection JSUnusedGlobalSymbols
export class PohEngine {
  size: Coords;
  canvas: HTMLCanvasElement;
  engine!: BabylonEngine;
  scene!: Scene;

  mainCamera!: MainCamera;
  environmentService!: Environment;
  terrainBuilder!: TerrainMesh;
  logicMesh!: LogicMesh;
  featureInstancer!: FeatureInstancer;
  objectInstancer!: ObjectInstancer;
  contextOverlay!: ContextOverlay;
  pathOverlay!: PathOverlay;
  guidanceOverlay!: GuidanceOverlay;
  detailOverlay!: DetailOverlay;
  gridOverlay!: GridOverlay;
  guiTexture!: AdvancedDynamicTexture;
  pathfinder!: Pathfinder;

  minimapCanvas?: HTMLCanvasElement;
  minimap?: Minimap;

  private _knownBounds: OrthoBounds | null = null;
  private flyToObserver: Observer<Scene> | null = null;
  private readonly _stopHandles: (() => void)[] = [];

  constructor(size: Coords, canvas: HTMLCanvasElement, minimapCanvas?: HTMLCanvasElement) {
    // Prevent strange bugs from happening
    if (size.x <= 0 || size.y <= 0) throw new Error("Invalid map size");

    this.size = size;
    this.canvas = canvas;
    this.canvas.addEventListener("pointerleave", this.onCanvasLeave);

    this.minimapCanvas = minimapCanvas;
  }

  private onCanvasLeave = (): void => {
    useCurrentContext().hover.value = undefined;
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
    this._stopHandles.push(
      watch(
        () => settings.renderScale,
        (newScale) => this.applyRenderScale(newScale),
      ),
    );

    return this;
  }

  initCamera(): this {
    this.mainCamera = new MainCamera(
      this.size,
      this.scene,
      this.canvas,
      () => this.knownBounds,
      this.contextOverlay,
      this.gridOverlay,
      this.guidanceOverlay,
      this.detailOverlay,
      this.pathOverlay,
    );

    this.flyToCurrentPlayer(true);

    return this;
  }

  initEnvironment(): this {
    this.environmentService = new Environment(this.scene, this.mainCamera.camera);

    return this;
  }

  initLogic(): this {
    this.logicMesh = new LogicMesh(this, useObjectsStore().getTiles);

    return this;
  }

  initTerrain(): this {
    this.terrainBuilder = new TerrainMesh(this.scene, this.size, useObjectsStore().getTiles);

    return this;
  }

  initGridOverlay(): this {
    this.gridOverlay = new GridOverlay(this.scene, this.size, useObjectsStore().getTiles);

    const settings = useSettingsStore();
    this._stopHandles.push(
      watch(
        () => settings.engineSettings.showGrid,
        (show) => this.gridOverlay.showLayer("grid", show),
        { immediate: true },
      ),
    );

    return this;
  }

  initPathfinding(): this {
    this.pathfinder = new Pathfinder();
    this.pathOverlay = new PathOverlay(this.scene, this.size);

    // Shared HUD layer for all GUI-based overlays
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("HUD", true, this.scene);
    this.guiTexture.renderAtIdealSize = true;

    this.guidanceOverlay = new GuidanceOverlay(this.scene);
    this.detailOverlay = new DetailOverlay(this.scene, this.guiTexture);

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

  initObjectInstancer(): this {
    const objStore = useObjectsStore();
    this.objectInstancer = new ObjectInstancer(
      this.scene,
      this.size,
      objStore.getClassGameObjects("construction") as Construction[],
      objStore.getClassGameObjects("unit") as Unit[],
    );

    return this;
  }

  initContextOverlay(): this {
    this.contextOverlay = new ContextOverlay(this.scene, this.size);

    // Watch for known/visible area changes to update minimap and clamping bounds
    const player = useObjectsStore().currentPlayer;
    this._stopHandles.push(
      watch(
        [player.knownTileKeys, player.visibleTileKeys],
        ([known]) => {
          this._knownBounds = calculateKnownBounds(this.size, known);
          // Trigger minimap update if it exists
          if (this.minimap) this.minimap.triggerCapture();
        },
        { immediate: true },
      ),
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
        this.contextOverlay,
        () => this.knownBounds,
      );
      this.minimap.capture();
    }

    return this;
  }

  initOrder(): { title: string; fn: () => void }[] {
    return [
      // All components require the engine/scene
      { title: "initEngineAndScene", fn: () => this.initEngineAndScene() },

      // No other requirements
      { title: "initContextOverlay", fn: () => this.initContextOverlay() },
      { title: "initGridOverlay", fn: () => this.initGridOverlay() },
      { title: "initPathfinding", fn: () => this.initPathfinding() },
      { title: "initLogic", fn: () => this.initLogic() },
      { title: "initObjects", fn: () => this.initObjectInstancer() },
      { title: "initTerrain", fn: () => this.initTerrain() },

      // Requires ContextOverlay & GridOverlay
      { title: "initCamera", fn: () => this.initCamera() },

      // Requires Terrain
      { title: "initFeatures", fn: () => this.initFeatures() },

      // Requires Camera
      { title: "initEnvironment", fn: () => this.initEnvironment() },

      // Start Rendering!
      { title: "render", fn: () => this.render() },

      // Optional minimap (if canvas was given)
      { title: "initMinimap", fn: () => this.initMinimap() },
    ];
  }

  init(): this {
    this.initOrder().forEach((process) => process.fn());
    return this;
  }

  dispose(): void {
    // Stop all Vue watchers
    this._stopHandles.forEach((stop) => stop());
    this._stopHandles.length = 0;

    // Stop flying
    this.stopFlying();

    // Optional minimap
    if (this.minimap) this.minimap.dispose();

    // Stop rendering
    window.removeEventListener("resize", this.onResize);
    this.engine.stopRenderLoop();

    // Stop requires camera
    this.environmentService.dispose();
    this.contextOverlay.dispose();

    // Stop requires terrain
    this.featureInstancer.dispose();
    this.objectInstancer.dispose();

    // Stop requires GridOverlay
    this.mainCamera.camera.dispose();

    // Stop others
    this.pathOverlay.dispose();
    this.guidanceOverlay.dispose();
    this.detailOverlay.dispose();
    this.guiTexture.dispose();
    this.gridOverlay.dispose();
    this.logicMesh.dispose();
    this.terrainBuilder.dispose();

    // Finally, stop the scene & engine
    this.canvas.removeEventListener("pointerleave", this.onCanvasLeave);
    this.scene.dispose();
    this.engine.dispose();
  }

  flyTo(coords: EngineCoords, teleport = false): PohEngine {
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
    const capital = currentPlayer.cities.find((city) => city.isCapital);
    if (capital) {
      this.flyToTile(capital.tileKey, teleport);
      return;
    }
  }

  // Public: move instantly to a percentage of world width/depth (0..1 each)
  flyToPercent(xPercent: number, yPercent: number, teleport = false): PohEngine {
    return this.flyTo(getEngineCoordsFromPercent(this.size, xPercent, yPercent), teleport);
  }

  flyToTile(tile: GameKey | string | Tile, teleport = false): PohEngine {
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
