import { Color4, Engine as BabylonEngine, Observer, Scalar, Scene, Vector3 } from "@babylonjs/core";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import {
  calculateKnownBounds,
  clampCoordsToBoundaries,
  getEngineCoordsFromPercent,
  type OrthoBounds,
  tileCenter,
} from "@/helpers/math";
import { TerrainMesh } from "@/Actor/Human/Terrain/TerrainMesh";
import { useDataBucket } from "@/Data/useDataBucket";
import { Environment } from "@/Actor/Human/Environment/Environment";
import LogicMesh from "@/Actor/Human/LogicMesh";
import { Minimap } from "@/Actor/Human/Cameras/Minimap";
import { MainCamera } from "@/Actor/Human/Cameras/MainCamera";
import FeatureInstancer from "@/Actor/Human/Instancers/FeatureInstancer";
import GridOverlay from "@/Actor/Human/Overlays/GridOverlay";
import { ObjectInstancer } from "@/Actor/Human/Instancers/ObjectInstancer";
import type { Tile } from "@/Common/Models/Tile";
import type { Unit } from "@/Common/Models/Unit";
import type { Construction } from "@/Common/Models/Construction";
import type { GameKey } from "@/Common/Models/_GameModel";
import { Coords, getCoordsFromTileKey } from "@/helpers/mapTools";
import { EngineCoords } from "@/Actor/Human/Terrain/_terrainMeshTypes";
import { useCurrentContext } from "@/composables/useCurrentContext";
import { Pathfinder } from "@/Simulation/Movement/Pathfinder";
import { useSettingsStore } from "@/stores/settingsStore";
import { watch } from "vue";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { ContextOverlay } from "@/Actor/Human/Overlays/ContextOverlay";
import { PathOverlay } from "@/Actor/Human/Overlays/PathOverlay";
import { GuidanceOverlay } from "@/Actor/Human/Overlays/GuidanceOverlay";
import { DetailOverlay } from "@/Actor/Human/Overlays/DetailOverlay";

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
  private readonly _injectedEngine?: BabylonEngine;

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

  initEngineAndScene(customEngine?: BabylonEngine): this {
    const settings = useSettingsStore().engineSettings;

    if (customEngine) {
      // Used in tests for NullEngine
      this.engine = customEngine;
    } else {
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
    }
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.63, 0.63, 0.63, 1); // Same-ish as snow

    // Allow for easy debugging
    (window as unknown as { engineService: PohEngine }).engineService = this;

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
    this.logicMesh = new LogicMesh(this, useDataBucket().getTiles());

    return this;
  }

  initTerrain(): this {
    this.terrainBuilder = new TerrainMesh(this.scene, this.size, useDataBucket().getTiles());

    return this;
  }

  initGridOverlay(): this {
    this.gridOverlay = new GridOverlay(this.scene, this.size, useDataBucket().getTiles());

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
      Object.values(useDataBucket().getTiles()),
      this.terrainBuilder.root,
    );

    return this;
  }

  initObjectInstancer(): this {
    const bucket = useDataBucket();
    this.objectInstancer = new ObjectInstancer(
      this.scene,
      this.size,
      // todo should we refactor instancer to accept the Set?
      Array.from(bucket.getClassObjects<Construction>("construction")),
      Array.from(bucket.getClassObjects<Unit>("unit")),
    );

    return this;
  }

  initContextOverlay(): this {
    this.contextOverlay = new ContextOverlay(this.scene, this.size);

    // Watch for known/visible area changes to update minimap and clamping bounds
    const player = useCurrentContext().currentPlayer;
    this._stopHandles.push(
      watch(
        () => [player.knownTileKeys, player.visibleTileKeys],
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

  initOrder(customEngine?: BabylonEngine): { title: string; fn: () => void }[] {
    return [
      // All components require the engine/scene
      { title: "Start Engine", fn: () => this.initEngineAndScene(customEngine) },

      // No other requirements
      { title: "Start ContextOverlay", fn: () => this.initContextOverlay() },
      { title: "Start GridOverlay", fn: () => this.initGridOverlay() },
      { title: "Start Pathfinding", fn: () => this.initPathfinding() },
      { title: "Start Logic", fn: () => this.initLogic() },
      { title: "Start Objects", fn: () => this.initObjectInstancer() },
      { title: "Start Terrain", fn: () => this.initTerrain() },

      // Requires ContextOverlay & GridOverlay
      { title: "Start Camera", fn: () => this.initCamera() },

      // Requires Terrain
      { title: "Start Features", fn: () => this.initFeatures() },

      // Requires Camera
      { title: "Start Environment", fn: () => this.initEnvironment() },

      // Start Rendering!
      { title: "Start Rendering", fn: () => this.render() },

      // Optional minimap (if canvas was given)
      { title: "Create Minimap", fn: () => this.initMinimap() },
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
    const currentPlayer = useCurrentContext().currentPlayer;

    // Unit has priority
    const unit = currentPlayer.units[0];
    if (unit) {
      this.flyToTile(unit.tileKey, teleport);
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
