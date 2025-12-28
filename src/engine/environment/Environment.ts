/**
 * EnvironmentService
 * A black‑box service that owns lighting, sky/environment and basic post‑processing.
 *
 * Notes:
 * - Names are intentionally verbose for readability. Avoid cryptic short names.
 * - Complex effects (rain particles, lightning, SSAO2, volumetric light) are deferred with TODOs.
 */

import {
  Camera,
  Color3,
  CubeTexture,
  DirectionalLight,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { watch } from "vue";
import { useSettingsStore } from "@/stores/settingsStore";
import { EnvironmentHelper } from "@babylonjs/core/Helpers/environmentHelper";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";

import { defaultTimeOfDay2400, getLightingForTimeOfDay } from "@/engine/environment/timeOfDay";
import { defaultMonth, getBlendedSeasonPalette } from "@/engine/environment/season";
import { defaultWeatherType, weatherPresets, WeatherType } from "@/engine/environment/weather";
import {
  clockHoursPerRealMinute,
  isClockRunning,
  timeOfDay2400,
  wrapTime2400,
} from "@/engine/environment/clock";
import { EngineSettings } from "@/engine/EngineSettings";
import { clamp, wrapInclusive } from "@/helpers/math";

export { WeatherType };

export type EnvironmentServiceConfig = {
  /** URL (relative to site root) of prefiltered .env environment texture placed under /public for offline use. */
  environmentTextureUrl: string;
  /** Size of the generated skybox cube (world units). */
  skyboxSizeWorldUnits: number;
  /** Create and enable shadow processing for the directional light. Currently not wired (reserved). */
  enableShadows: boolean;
  /** Enable the default post-processing pipeline (FXAA, Bloom). */
  enablePostProcessing: boolean;
  /**
   * Clock rate: how many in-game hours pass per one real-time minute when the clock is running.
   * Example: 1.0 means 1 in-game hour per real minute.
   */
  clockHoursPerRealMinute: number;
  /** Start with the clock running or paused. */
  startWithClockRunning: boolean;
  /** Default ambient hemispheric light intensity. */
  ambientHemisphericLightIntensity: number;
  /** Default ambient hemispheric sky color. */
  ambientHemisphericSkyColor: Color3;
  /** Default ambient hemispheric ground color. */
  ambientHemisphericGroundColor: Color3;
  /** Default directional sun light direction. */
  directionalSunLightDirection: Vector3;
  /** Default directional sun light intensity. */
  directionalSunLightIntensity: number;
};

const defaultEnvironmentServiceConfig: EnvironmentServiceConfig = {
  // Use the offline environment texture committed under public/env by default.
  environmentTextureUrl: "/env/environment.env",
  skyboxSizeWorldUnits: 1000,
  enableShadows: false,
  enablePostProcessing: true,
  // Run fast by default so cycle is clearly visible: 1 in-game hour per 1 real second
  // 60 in-game hours per real minute
  clockHoursPerRealMinute: 60.0,
  startWithClockRunning: true,
  ambientHemisphericLightIntensity: 0.6,
  ambientHemisphericSkyColor: new Color3(0.85, 0.9, 1.0),
  ambientHemisphericGroundColor: new Color3(0.6, 0.7, 0.65),
  directionalSunLightDirection: new Vector3(-0.5, -1.0, -0.35),
  directionalSunLightIntensity: 1.0,
};

export class Environment {
  private readonly scene: Scene;
  private readonly camera: Camera;
  private readonly configuration: EnvironmentServiceConfig;

  private environmentHelper?: EnvironmentHelper;

  private hemisphericAmbientLight!: HemisphericLight;
  private directionalSunLight!: DirectionalLight;
  private baseDirectionalSunLightIntensity: number = 1.0;
  private weatherSunIntensityScale: number = 1.0;

  // undefined if user has disabled render effects in settings
  private renderingPipeline?: DefaultRenderingPipeline;

  // World state (target values). These can be set from the outside via the public API.
  private targetTimeOfDay2400: number = defaultTimeOfDay2400; // 0..2400 (kept for backward compat; source of truth is timeOfDay2400 ref)
  private month: number = defaultMonth; // 1..12
  private weatherType: WeatherType = defaultWeatherType;

  private _clockIntervalId?: number;

  private watchers: (() => void)[] = [];

  constructor(scene: Scene, camera: Camera, configuration?: Partial<EnvironmentServiceConfig>) {
    this.scene = scene;
    this.camera = camera;
    this.configuration = {
      ...defaultEnvironmentServiceConfig,
      ...configuration,
    } as EnvironmentServiceConfig;

    // Initialize shared clock refs from defaults (only once at service creation)
    timeOfDay2400.value = this.targetTimeOfDay2400;
    isClockRunning.value = this.configuration.startWithClockRunning;
    clockHoursPerRealMinute.value = this.configuration.clockHoursPerRealMinute;

    // Set up the environment and core lights with safe defaults.
    this.setupEnvironmentSkyboxAndTexture();
    this.setupLights();

    // --- Settings watchers (each key independently) ---
    const settings = useSettingsStore();

    // Time of day (0..2400)
    this.setTimeOfDay(settings.engineSettings.timeOfDay2400);
    this.watchers.push(
      watch(
        () => settings.engineSettings.timeOfDay2400,
        (v) => this.setTimeOfDay(v),
      ),
    );
    // Clock running toggle
    this.setIsClockRunning(settings.engineSettings.isClockRunning);
    this.watchers.push(
      watch(
        () => settings.engineSettings.isClockRunning,
        (v) => this.setIsClockRunning(v),
      ),
    );
    // Month 1..12
    this.setMonth(settings.engineSettings.month);
    this.watchers.push(
      watch(
        () => settings.engineSettings.month,
        (v) => this.setMonth(v),
      ),
    );
    // Weather type
    this.setWeather(settings.engineSettings.weatherType);
    this.watchers.push(
      watch(
        () => settings.engineSettings.weatherType,
        (v) => this.setWeather(v),
      ),
    );

    // FX toggles and params
    this.setPostProcessing(settings.engineSettings);
    this.watchers.push(
      watch(
        () => settings.engineSettings.useFxaa,
        (v) => this.setPostProcessing({ useFxaa: v }),
      ),
    );
    this.watchers.push(
      watch(
        () => settings.engineSettings.useBloom,
        (v) => this.setPostProcessing({ useBloom: v }),
      ),
    );
    this.watchers.push(
      watch(
        () => settings.engineSettings.bloomThreshold,
        (v) => this.setPostProcessing({ bloomThreshold: v }),
      ),
    );
    this.watchers.push(
      watch(
        () => settings.engineSettings.bloomWeight,
        (v) => this.setPostProcessing({ bloomWeight: v }),
      ),
    );
  }

  /** Update the target time of day using a 24-hour clock encoded as 0..2400 integers.
   * If the clock is running, the current time is set as well so the change is visible immediately,
   * and the clock continues advancing from the new value.
   */
  public setTimeOfDay(timeOfDayValue2400: number): void {
    this.targetTimeOfDay2400 = Environment.clampTime2400(timeOfDayValue2400);
    timeOfDay2400.value = this.targetTimeOfDay2400;
    this.updateSunFromTimeOfDay(timeOfDay2400.value);
  }

  /** Update the current season using a 1..12 month index. */
  public setMonth(month: number): void {
    this.month = Environment.normalizeMonth1to12(month);
    this.applySeasonPalette(this.month);
  }

  /** Update the active weather type. */
  public setWeather(weatherType: WeatherType): void {
    this.weatherType = weatherType;
    // Apply immediate visual preset for the selected weather.
    this.applyWeatherPreset(this.weatherType);
  }

  /** Start or stop the internal clock. */
  public setIsClockRunning(isRunning: boolean): void {
    isClockRunning.value = isRunning;
    if (isRunning) this.startClockInterval();
    else this.stopClockInterval();
  }

  /** Dispose all Babylon resources created by this service. */
  // todo: double-check all hooks, listeners, etc are also removed.
  // Shutting the engine process: app.Data.engine.dispose(); appStore.engine = undefined;
  // So each dispose down the chain doesn't set internals to undefined/null BUT has to make sure everything is decoupled for auto-garbage-collection
  public dispose(): void {
    this.stopClockInterval();
    this.watchers.forEach((unwatch) => unwatch());
    this.watchers = [];
    this.renderingPipeline?.dispose();
    this.renderingPipeline = undefined;
    if (this.environmentHelper) this.environmentHelper.dispose();
    this.directionalSunLight.dispose();
    this.hemisphericAmbientLight.dispose();
  }

  // ----- Internal setup helpers -----

  private setupEnvironmentSkyboxAndTexture(): void {
    if (!this.configuration.environmentTextureUrl.trim()) return;

    const environmentTexture = CubeTexture.CreateFromPrefilteredData(
      this.configuration.environmentTextureUrl,
      this.scene,
    );

    this.environmentHelper = new EnvironmentHelper(
      {
        environmentTexture,
        createSkybox: true,
        skyboxSize: this.configuration.skyboxSizeWorldUnits,
        createGround: false, // top-down game: ground plane not needed by default
      },
      this.scene,
    );
  }

  // ----- Clock interval (single lightweight ticker) -----

  private startClockInterval(): void {
    if (this._clockIntervalId === undefined) {
      this._clockIntervalId = window.setInterval(() => {
        if (!isClockRunning.value) return;

        timeOfDay2400.value = wrapTime2400(
          timeOfDay2400.value + this.configuration.clockHoursPerRealMinute / 600,
        );

        this.updateSunFromTimeOfDay(timeOfDay2400.value);
        this.applySeasonPalette(this.month);
      }, 100);
    }
  }

  private stopClockInterval(): void {
    if (this._clockIntervalId) {
      clearInterval(this._clockIntervalId);
      this._clockIntervalId = undefined;
    }
  }

  private setupLights(): void {
    // Ambient sky/ground contribution: low and neutral; season and weather can adjust later.
    this.hemisphericAmbientLight = new HemisphericLight(
      "ambientSkyLight",
      Vector3.Up(),
      this.scene,
    );
    this.hemisphericAmbientLight.intensity = this.configuration.ambientHemisphericLightIntensity;
    this.hemisphericAmbientLight.diffuse = this.configuration.ambientHemisphericSkyColor.clone();
    this.hemisphericAmbientLight.groundColor =
      this.configuration.ambientHemisphericGroundColor.clone();
    // Remove hemispheric specular contribution to avoid double highlights on water/terrain
    this.hemisphericAmbientLight.specular = Color3.Black();

    // Sun/moon directional light. Direction is conservative for a top-down view.
    this.directionalSunLight = new DirectionalLight(
      "directionalSunLight",
      this.configuration.directionalSunLightDirection.clone(),
      this.scene,
    );
    this.directionalSunLight.intensity = this.configuration.directionalSunLightIntensity;
    this.baseDirectionalSunLightIntensity = this.configuration.directionalSunLightIntensity;
    this.directionalSunLight.diffuse = Color3.White();
    this.directionalSunLight.specular = Color3.White();

    // TODO: Optional shadow generator can be created here if/when needed.
  }

  /**
   * Update post-processing options at runtime. Safe to call even if the pipeline is disabled.
   * Only provided fields are applied.
   */
  public setPostProcessing(options: Partial<EngineSettings>): void {
    if (!this.configuration.enablePostProcessing) {
      if (this.renderingPipeline) {
        this.renderingPipeline.dispose();
        this.renderingPipeline = undefined;
      }
      return;
    }

    if (!this.renderingPipeline) {
      this.renderingPipeline = new DefaultRenderingPipeline(
        "defaultRenderingPipeline",
        options.hdr,
        this.scene,
        [this.camera],
      );
    }

    if (options.useFxaa !== undefined) {
      this.renderingPipeline.fxaaEnabled = options.useFxaa;
    }
    if (options.useBloom !== undefined) {
      this.renderingPipeline.bloomEnabled = options.useBloom;
    }
    if (options.bloomThreshold !== undefined) {
      this.renderingPipeline.bloomThreshold = options.bloomThreshold;
    }
    if (options.bloomWeight !== undefined) {
      this.renderingPipeline.bloomWeight = options.bloomWeight;
    }
  }

  // ----- Static helpers (validation and clamping) -----

  private applyWeatherPreset(weatherType: WeatherType): void {
    const scene = this.scene;
    const preset = weatherPresets[weatherType];

    const fogColor = preset.fogColor.clone();

    if (preset.fogDensity > 0) {
      scene.fogMode = Scene.FOGMODE_EXP2;
      scene.fogDensity = preset.fogDensity;
      scene.fogColor = fogColor;
    } else {
      scene.fogMode = Scene.FOGMODE_NONE;
      scene.fogDensity = 0;
      // Keep fogColor coherent with sky/ambient even if unused
      scene.fogColor = fogColor;
    }

    // Data the weather multiplier and re-apply sun intensity using current time-of-day
    this.weatherSunIntensityScale = preset.sunIntensityScale;

    // Use the reactive clock refs for the effective time when running; otherwise use target
    const effectiveTime = isClockRunning.value ? timeOfDay2400.value : this.targetTimeOfDay2400;
    this.updateSunFromTimeOfDay(effectiveTime);
  }

  /** Set hemispheric ambient sky and ground colors based on a month index (1..12). */
  private applySeasonPalette(month: number): void {
    const p = getBlendedSeasonPalette(month);

    if (this.hemisphericAmbientLight) {
      this.hemisphericAmbientLight.diffuse = p.sky;
      this.hemisphericAmbientLight.groundColor = p.ground;
    }
    // Keep fog color broadly consistent with the sky tint if fog is active
    if (this.scene.fogMode !== Scene.FOGMODE_NONE) {
      this.scene.fogColor = p.sky.clone();
    }
  }

  /** Clamp a 24-hour clock integer to the inclusive range 0..2400. */
  public static clampTime2400(value2400: number): number {
    return clamp(Math.round(value2400), 0, 2399);
  }

  /** Normalize a month index to the inclusive range 1..12. */
  public static normalizeMonth1to12(monthIndex: number): number {
    return wrapInclusive(Math.round(monthIndex), 1, 12);
  }

  // ----- Time-of-day lighting -----
  /**
   * KISS: Get lighting values from timeOfDay.ts and apply them. No derivation math here.
   */
  private updateSunFromTimeOfDay(timeOfDayValue2400: number): void {
    if (!this.directionalSunLight || !this.hemisphericAmbientLight) return;

    const state = getLightingForTimeOfDay(timeOfDayValue2400);

    // Apply sun (directional light)
    this.directionalSunLight.direction.copyFrom(state.sunDirection);
    this.directionalSunLight.intensity =
      this.baseDirectionalSunLightIntensity * this.weatherSunIntensityScale * state.sunStrength01;
    this.directionalSunLight.diffuse = state.sunColor.clone();
    this.directionalSunLight.specular = state.sunColor.clone();

    // Apply ambient (hemispheric) for moon glow / general ambience
    this.hemisphericAmbientLight.intensity = state.ambientIntensity;
    this.hemisphericAmbientLight.diffuse = state.ambientSkyColor.clone();
    this.hemisphericAmbientLight.groundColor = state.ambientGroundColor.clone();
  }
}
