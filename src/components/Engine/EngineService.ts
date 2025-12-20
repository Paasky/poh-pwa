import {
  ArcRotateCamera,
  Color4,
  Engine as BabylonEngine,
  Observer,
  Scalar,
  Scene,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import {
  clamp,
  getWorldDepth,
  getWorldMinX,
  getWorldMinZ,
  getWorldWidth,
  tileCenter,
} from "@/helpers/math";
import { TerrainMeshBuilder } from "@/factories/TerrainMeshBuilder/TerrainMeshBuilder";
import { useObjectsStore } from "@/stores/objectStore";
import { EnvironmentService } from "@/components/Engine/EnvironmentService";
import LogicMeshBuilder from "@/factories/LogicMeshBuilder";
import { useHoveredTile } from "@/stores/hoveredTile";
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

// noinspection JSUnusedGlobalSymbols
export class EngineService {
  size: Coords;
  canvas: HTMLCanvasElement;
  engine!: BabylonEngine;
  scene!: Scene;
  terrainRoot!: TransformNode;

  camera!: ArcRotateCamera;
  mainCamera!: MainCamera;
  environmentService!: EnvironmentService;
  terrainBuilder!: TerrainMeshBuilder;
  logicMesh!: LogicMeshBuilder;
  featureInstancer!: FeatureInstancer;
  fogOfWar!: FogOfWar;
  gridOverlay!: GridOverlay;

  minimapCanvas?: HTMLCanvasElement;
  minimap?: Minimap;

  private flyToObserver: Observer<Scene> | null = null;

  constructor(size: Coords, canvas: HTMLCanvasElement, minimapCanvas?: HTMLCanvasElement) {
    // Prevent strange bugs from happening
    if (size.x <= 0 || size.y <= 0) throw new Error("Invalid map size");

    this.size = size;
    this.canvas = canvas;
    this.minimapCanvas = minimapCanvas;
  }

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
      (scale) => this.applyRenderScale(scale),
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
    );
    this.camera = this.mainCamera.camera;

    this.flyToCurrentPlayer();

    return this;
  }

  initEnvironment(): this {
    this.environmentService = new EnvironmentService(this.scene, this.camera);

    return this;
  }

  initLogic(): this {
    this.logicMesh = new LogicMeshBuilder(this.scene, this.size, useObjectsStore().getTiles);

    const hovered = useHoveredTile();
    this.logicMesh.onTileHover((tile) => hovered.set(tile));
    this.logicMesh.onTileExit(() => hovered.clear());

    return this;
  }

  initTerrain(): this {
    this.terrainBuilder = new TerrainMeshBuilder(this.scene, this.size, useObjectsStore().getTiles);
    this.terrainRoot = this.terrainBuilder.root;

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
      this.terrainRoot,
    );

    return this;
  }

  initFogOfWar(): this {
    this.fogOfWar = new FogOfWar(this.size, this.scene, useObjectsStore().getTiles);
    return this;
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
      this.minimap = new Minimap(this.size, this.minimapCanvas, this.engine, this.fogOfWar);
      this.minimap.capture();
    }

    return this;
  }

  initOrder() {
    return [
      // All components require the engine/scene
      () => this.initEngineAndScene(),

      // No other requirements
      () => this.initFogOfWar(),
      () => this.initGridOverlay(),
      () => this.initLogic(),
      () => this.initTerrain(),

      // Requires  FogOfWar & GridOverlay
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
    // Dispose in reverse order of initOrder()

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
    this.camera.dispose();

    // Stop others
    this.gridOverlay.dispose();
    this.logicMesh.dispose();
    this.terrainBuilder.dispose();

    // Finally, stop the scene & engine
    this.scene.dispose();
    this.engine.dispose();
  }

  flyTo(coords: EngineCoords): EngineService {
    const targetPos = new Vector3(coords.x, 0, coords.z);
    const startPos = this.camera.target.clone();
    const duration = 0.5; // 1 second
    let elapsed = 0;

    // Remove any existing flyTo observer
    this.stopFlying();

    this.flyToObserver = this.scene.onBeforeRenderObservable.add(() => {
      const dt = this.engine.getDeltaTime() / 1000;
      elapsed += dt;

      // 1. Calculate linear completion (0 to 1)
      const linearT = Scalar.Clamp(elapsed / duration, 0, 1);

      // 2. Apply SmoothStep to get the "speed up, then speed down" effect
      // This creates the organic acceleration/deceleration curve
      const easedT = Scalar.SmoothStep(0, 1, linearT);

      // 3. Use the eased value for position interpolation
      Vector3.LerpToRef(startPos, targetPos, easedT, this.camera.target);

      if (linearT >= 1) {
        this.stopFlying();
      }
    });

    return this;
  }

  flyToCurrentPlayer(): void {
    const currentPlayer = useObjectsStore().currentPlayer;

    // Capital or first unit
    const capital = currentPlayer.cities.value.find((c) => c.isCapital);
    if (capital) {
      this.flyToTile(capital.tileKey);
    }

    const unit = currentPlayer.units.value[0];
    if (unit) {
      this.flyToTile(unit.tileKey.value);
    }

    return;
  }

  // Public: move instantly to a percentage of world width/depth (0..1 each)
  flyToPercent(xPercent: number, yPercent: number): EngineService {
    // Clamp percents
    const widthPercent = clamp(xPercent, 0, 1);
    const depthPercent = clamp(yPercent, 0, 1);

    // Map to world coordinates
    const worldWidth = getWorldWidth(this.size.x);
    const worldDepth = getWorldDepth(this.size.y);
    return this.flyTo({
      x: getWorldMinX(worldWidth) + widthPercent * worldWidth,

      // Flip Z (y=0 is north, y=max is south)
      z: getWorldMinZ(worldDepth) - depthPercent * worldDepth,
    });
  }

  flyToTile(tile: GameKey | string | Tile): EngineService {
    if (typeof tile === "string") {
      const coords = getCoordsFromTileKey(tile as GameKey);
      return this.flyTo(tileCenter(this.size, coords));
    } else {
      return this.flyTo(tileCenter(this.size, tile));
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

  private applyRenderScale(scale: number) {
    const safeScale = Math.max(0.25, Math.min(2, scale || 1));
    const level = 1 / safeScale;
    this.engine.setHardwareScalingLevel(level);
  }
}
