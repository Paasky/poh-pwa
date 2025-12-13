/**
 * EnvironmentService
 * A black‑box service that owns lighting, sky/environment and basic post‑processing.
 *
 * Goals for this initial scaffold (minimal code, prefab-first):
 * - Create a Babylon EnvironmentHelper skybox + environment texture so PBR works offline.
 * - Create core lights (hemispheric + directional) with conservative defaults.
 * - Provide a small, clear public API to set the time of day, season, and weather without exposing internals.
 * - Keep every numeric or string setting configurable via a config object with explicit defaults.
 * - Do NOT wire this up elsewhere yet. No side-effects outside this file and the exported configs.
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
  Engine,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { EnvironmentHelper } from "@babylonjs/core/Helpers/environmentHelper";
import {
  DefaultRenderingPipeline
} from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";

import { defaultTimeOfDay2400 } from "@/components/Engine/environments/timeOfDay";
import { defaultSeasonMonth1to12 } from "@/components/Engine/environments/season";
import { defaultWeatherType, WeatherType } from "@/components/Engine/environments/weather";
import { DefaultPostProcessingOptions, defaultPostProcessingOptions, } from "@/components/Engine/environments/postFx";

/**
 * Weather configuration is enumerated with WeatherType. Additional per-weather tunables can be added later.
 */
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
  /** Post-processing default options (thresholds, toggles). */
  postProcessingOptions: DefaultPostProcessingOptions;
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
  postProcessingOptions: defaultPostProcessingOptions,
  clockHoursPerRealMinute: 1.0,
  startWithClockRunning: false,
  ambientHemisphericLightIntensity: 0.6,
  ambientHemisphericSkyColor: new Color3(0.85, 0.9, 1.0),
  ambientHemisphericGroundColor: new Color3(0.6, 0.7, 0.65),
  directionalSunLightDirection: new Vector3(-0.5, -1.0, -0.35),
  directionalSunLightIntensity: 1.0,
};

export class EnvironmentService {
  private readonly scene: Scene;
  private readonly engine: Engine; // todo not used, can this be omitted? Is it needed for our various gfx settings?
  private readonly camera: Camera;
  private readonly configuration: EnvironmentServiceConfig;

  // @ts-expect-error This is set via setupEnvironmentSkyboxAndTexture() in constructor
  private environmentHelper: EnvironmentHelper;

  // @ts-expect-error This is set via setupLights() in constructor
  private hemisphericAmbientLight: HemisphericLight;
  // @ts-expect-error This is set via setupLights() in constructor
  private directionalSunLight: DirectionalLight;
  private baseDirectionalSunLightIntensity: number = 1.0;
  private weatherSunIntensityScale: number = 1.0;

  // undefined if user has disabled render effects in settings
  private renderingPipeline?: DefaultRenderingPipeline;

  // World state (target values). These can be set from the outside via the public API.
  private targetTimeOfDay2400: number = defaultTimeOfDay2400; // 0..2400
  private targetSeasonMonth1to12: number = defaultSeasonMonth1to12; // 1..12
  private targetWeatherType: WeatherType = defaultWeatherType;

  // Clock state.
  private isClockRunning: boolean;
  private currentTimeOfDay2400: number;

  constructor(
    scene: Scene,
    camera: Camera,
    engine: Engine,
    configuration?: Partial<EnvironmentServiceConfig>,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.engine = engine;
    this.configuration = {
      ...defaultEnvironmentServiceConfig,
      ...configuration,
    } as EnvironmentServiceConfig;

    // Initialize clock state.
    this.isClockRunning = this.configuration.startWithClockRunning;
    this.currentTimeOfDay2400 = this.targetTimeOfDay2400;

    // Set up the environment and core lights with safe defaults.
    this.setupEnvironmentSkyboxAndTexture();
    this.setupLights();
    this.setupPostProcessingIfEnabled();

    // Apply initial weather preset (fog/intensity) based on defaults
    this.applyWeatherPreset(this.targetWeatherType);
    // Apply initial season palette to ambient light
    this.applySeasonPalette(this.targetSeasonMonth1to12);
    // Initialize sun direction/intensity from time of day
    const initialEffectiveTime = this.isClockRunning
      ? this.currentTimeOfDay2400
      : this.targetTimeOfDay2400;
    this.updateSunFromTimeOfDay(initialEffectiveTime);
  }

  /** Update the target time of day using a 24-hour clock encoded as 0..2400 integers.
   * If the clock is running, the current time is set as well so the change is visible immediately,
   * and the clock continues advancing from the new value.
   */
  public setTimeOfDay(timeOfDayValue2400: number): void {
    this.targetTimeOfDay2400 = EnvironmentService.clampTime2400(timeOfDayValue2400);
    if (this.isClockRunning) {
      this.currentTimeOfDay2400 = this.targetTimeOfDay2400;
    }
    const effectiveTime = this.isClockRunning
      ? this.currentTimeOfDay2400
      : this.targetTimeOfDay2400;
    this.updateSunFromTimeOfDay(effectiveTime);
  }

  /** Update the current season using a 1..12 month index. */
  public setSeason(monthIndex1to12: number): void {
    this.targetSeasonMonth1to12 = EnvironmentService.normalizeMonth1to12(monthIndex1to12);
    this.applySeasonPalette(this.targetSeasonMonth1to12);
  }

  /** Update the active weather type. */
  public setWeather(weatherType: WeatherType): void {
    this.targetWeatherType = weatherType;
    // Apply immediate visual preset for the selected weather.
    this.applyWeatherPreset(this.targetWeatherType);
  }

  /** Start or stop the internal clock. */
  public setIsClockRunning(isRunning: boolean): void {
    this.isClockRunning = isRunning;
  }

  // ---------- Getters (public, for UI sync) ----------
  /** Returns the effective time of day (0..2400) currently used for rendering. */
  public getEffectiveTimeOfDay2400(): number {
    return this.isClockRunning ? this.currentTimeOfDay2400 : this.targetTimeOfDay2400;
  }

  /** Returns whether the environment clock is running. */
  public getIsClockRunning(): boolean {
    return this.isClockRunning;
  }

  /** Returns the currently selected target season month (1..12). */
  public getSeasonMonth1to12(): number {
    return this.targetSeasonMonth1to12;
  }

  /** Returns the currently selected target weather type. */
  public getWeatherType(): WeatherType {
    return this.targetWeatherType;
  }

  /**
   * Advance environment animations and clock. Call once per frame with elapsed seconds.
   * This initial scaffold only advances the clock; visual transitions are deferred.
   */
  public update(elapsedSeconds: number): void {
    if (this.isClockRunning && elapsedSeconds > 0) {
      const hoursAdvanced = (this.configuration.clockHoursPerRealMinute / 60) * elapsedSeconds;
      const valueAdvanced2400 = Math.round(hoursAdvanced * 100);
      this.currentTimeOfDay2400 = EnvironmentService.wrapTime2400(
        this.currentTimeOfDay2400 + valueAdvanced2400,
      );
    }

    // Update sun direction and intensity based on current effective time of day
    const effectiveTime = this.isClockRunning
      ? this.currentTimeOfDay2400
      : this.targetTimeOfDay2400;
    this.updateSunFromTimeOfDay(effectiveTime);
  }

  /** Dispose all Babylon resources created by this service. */
  // todo: double-check all hooks, listeners, etc are also removed.
  // Shutting the engine process: app.Store.engine.dispose(); appStore.engine = undefined;
  // So each dispose down the chain doesn't set internals to undefined/null BUT has to make sure everything is decoupled for auto-garbage-collection
  public dispose(): void {
    this.renderingPipeline?.dispose();
    this.renderingPipeline = undefined;
    this.environmentHelper.dispose();
    this.directionalSunLight.dispose();
    this.hemisphericAmbientLight.dispose();
  }

  // ----- Internal setup helpers -----

  private setupEnvironmentSkyboxAndTexture(): void {
    // todo should this have a default value? Would it make sense to create a separate sky.ts (or will the sky depend on weather?)
    const shouldCreateEnvironmentTexture =
      this.configuration.environmentTextureUrl.trim().length > 0;

    const environmentTexture = shouldCreateEnvironmentTexture
      ? CubeTexture.CreateFromPrefilteredData(this.configuration.environmentTextureUrl, this.scene)
      : undefined;

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

  // todo can this be combined with setPostProcessingOptions()?
  private setupPostProcessingIfEnabled(): void {
    // todo: If the pipeline is setup, dispose it and set to undefined
    if (!this.configuration.enablePostProcessing) return;

    const post = new DefaultRenderingPipeline("defaultRenderingPipeline", true, this.scene, [
      this.camera,
    ]);
    this.renderingPipeline = post;

    // FXAA
    post.fxaaEnabled = this.configuration.postProcessingOptions.enableFastApproximateAntialiasing;

    // Bloom
    post.bloomEnabled = this.configuration.postProcessingOptions.enableBloom;
    post.bloomThreshold = this.configuration.postProcessingOptions.bloomThreshold;
    post.bloomWeight = this.configuration.postProcessingOptions.bloomWeight;
  }

  /**
   * Update post-processing options at runtime. Safe to call even if the pipeline is disabled.
   * Only provided fields are applied.
   */
  public setPostProcessingOptions(options: Partial<DefaultPostProcessingOptions>): void {
    // Update stored configuration so future resets remain consistent
    this.configuration.postProcessingOptions = {
      ...this.configuration.postProcessingOptions,
      ...options,
    };
    if (!this.renderingPipeline) return;
    if (options.enableFastApproximateAntialiasing !== undefined) {
      this.renderingPipeline.fxaaEnabled = options.enableFastApproximateAntialiasing;
    }
    if (options.enableBloom !== undefined) {
      this.renderingPipeline.bloomEnabled = options.enableBloom;
    }
    if (options.bloomThreshold !== undefined) {
      this.renderingPipeline.bloomThreshold = options.bloomThreshold;
    }
    if (options.bloomWeight !== undefined) {
      this.renderingPipeline.bloomWeight = options.bloomWeight;
    }
  }

  // ----- Static helpers (validation and clamping) -----

  // todo move these settings to weather.ts; our job here is just to apply, not define
  // ----- Weather presets (fog and mood) -----
  /** Apply simple per-weather presets: fog mode/density/color and sun intensity multiplier. */
  private applyWeatherPreset(weatherType: WeatherType): void {
    const scene = this.scene;
    const presets: Record<
      WeatherType,
      { fogDensity: number; fogColor: Color3; sunIntensityScale: number }
    > = {
      [WeatherType.Sunny]: {
        fogDensity: 0,
        fogColor: this.hemisphericAmbientLight?.diffuse.clone() ?? new Color3(0.8, 0.85, 0.95),
        sunIntensityScale: 1.0,
      },
      [WeatherType.HalfCloud]: {
        fogDensity: 0.002,
        fogColor: this.hemisphericAmbientLight?.diffuse.clone() ?? new Color3(0.75, 0.8, 0.9),
        sunIntensityScale: 0.85,
      },
      [WeatherType.Foggy]: {
        fogDensity: 0.02,
        fogColor: Color3.FromHexString("#bfc8d6"),
        sunIntensityScale: 0.6,
      },
      [WeatherType.Rainy]: {
        fogDensity: 0.01,
        fogColor: Color3.FromHexString("#a0a9b5"),
        sunIntensityScale: 0.75,
      },
      [WeatherType.Thunderstorm]: {
        fogDensity: 0.015,
        fogColor: Color3.FromHexString("#8b95a5"),
        sunIntensityScale: 0.7,
      },
    };

    const preset = presets[weatherType];
    if (preset.fogDensity > 0) {
      scene.fogMode = Scene.FOGMODE_EXP2;
      scene.fogDensity = preset.fogDensity;
      scene.fogColor = preset.fogColor.clone();
    } else {
      scene.fogMode = Scene.FOGMODE_NONE;
      scene.fogDensity = 0;
      // Keep fogColor coherent with sky/ambient even if unused
      scene.fogColor = preset.fogColor.clone();
    }

    // Store the weather multiplier and re-apply sun intensity using current time-of-day
    this.weatherSunIntensityScale = preset.sunIntensityScale;
    const effectiveTime = this.isClockRunning
      ? this.currentTimeOfDay2400
      : this.targetTimeOfDay2400;
    this.updateSunFromTimeOfDay(effectiveTime);
  }

  // todo move these settings to season.ts; our job here is just to apply, not define
  // ----- Season palette (ambient sky/ground colors) -----
  /** Set hemispheric ambient sky and ground colors based on a month index (1..12). */
  private applySeasonPalette(monthIndex1to12: number): void {
    const month = EnvironmentService.normalizeMonth1to12(monthIndex1to12);
    // Simple palette: spring (3-5), summer (6-8), autumn (9-11), winter (12-2)
    const spring = {
      sky: Color3.FromHexString("#cfe7ff"),
      ground: Color3.FromHexString("#a5d6a7"),
    };
    const summer = {
      sky: Color3.FromHexString("#bde0ff"),
      ground: Color3.FromHexString("#8bdc65"),
    };
    const autumn = {
      sky: Color3.FromHexString("#ffd9b3"),
      ground: Color3.FromHexString("#d87b42"),
    };
    const winter = {
      sky: Color3.FromHexString("#dbe6f2"),
      ground: Color3.FromHexString("#b4c5d2"),
    };
    const palette = [
      winter,
      winter,
      spring,
      spring,
      spring,
      summer,
      summer,
      summer,
      autumn,
      autumn,
      autumn,
      winter,
    ];
    const p = palette[month - 1];
    if (this.hemisphericAmbientLight) {
      this.hemisphericAmbientLight.diffuse = p.sky.clone();
      this.hemisphericAmbientLight.groundColor = p.ground.clone();
    }
    // Keep fog color broadly consistent with the sky tint if fog is active
    if (this.scene.fogMode !== Scene.FOGMODE_NONE) {
      this.scene.fogColor = p.sky.clone();
    }
  }

  // todo use clamp() from math.ts
  /** Clamp a 24-hour clock integer to the inclusive range 0..2400. */
  public static clampTime2400(value2400: number): number {
    const rounded = Math.round(value2400);
    if (rounded < 0) return 0;
    if (rounded > 2400) return 2400;
    return rounded;
  }

  // todo create wrap() from math.ts (very useful function, add a todo-note to make our wrapX functions use it too)
  /** Wrap a 24-hour clock integer so it stays within 0..2400 while preserving modular time. */
  public static wrapTime2400(value2400: number): number {
    let wrapped = value2400 % 2400;
    if (wrapped < 0) wrapped += 2400;
    return wrapped;
  }

  // todo: use the new wrap function here?
  /** Normalize a month index to the inclusive range 1..12. */
  public static normalizeMonth1to12(monthIndex: number): number {
    const rounded = Math.round(monthIndex);
    const mod = (((rounded - 1) % 12) + 12) % 12; // safe modulo
    return mod + 1;
  }

  // todo move these settings to timeOfDay.ts; our job here is just to apply, not define
  // also: 1000-1600: day; 1900: sunset midpoint; 2200-0400: night; 0700: sunrise midpoint
  // also: transition time at 1h (100) per 100ms for a cool effect
  // ----- Time-of-day lighting -----
  /**
   * Update the directional sun light's direction, intensity and color from a 0..2400 time-of-day value.
   * Uses a simple analytical sky path: azimuth sweeps ~270°, elevation follows a sine.
   */
  private updateSunFromTimeOfDay(timeOfDayValue2400: number): void {
    if (!this.directionalSunLight) return;
    const t = Math.max(0, Math.min(2400, Math.round(timeOfDayValue2400))) / 2400; // 0..1
    // Azimuth: start slightly SE and sweep across the sky
    const azimuthRadians = -Math.PI * 0.25 + t * Math.PI * 1.5; // ~-45° .. 225°
    // Elevation: sine over a day; clamp a bit below horizon to keep a dim moon-like light
    const elevationRadians = Math.sin(t * Math.PI * 2) * 0.9; // -0.9..0.9

    // Directional light points FROM the light to the scene (negative Y when sun is above horizon)
    const dirX = Math.cos(elevationRadians) * Math.cos(azimuthRadians);
    const dirY = -Math.sin(elevationRadians);
    const dirZ = Math.cos(elevationRadians) * Math.sin(azimuthRadians);
    this.directionalSunLight.direction.set(dirX, dirY, dirZ);

    // Intensity rises with elevation; zero when far below horizon.
    const dayFactor = Math.max(0, Math.sin(Math.max(0, elevationRadians)));
    const intensity =
      this.baseDirectionalSunLightIntensity *
      this.weatherSunIntensityScale *
      (0.2 + dayFactor * 1.0);
    this.directionalSunLight.intensity = intensity;

    // Light color: blend night → dusk → day based on elevation
    const dayColor = Color3.White();
    const duskColor = Color3.FromHexString("#ffb380");
    const nightColor = Color3.FromHexString("#a7c7ff").scale(0.35);
    const k = Math.max(0, Math.min(1, (elevationRadians + 0.3) / 0.8));
    const color =
      k < 0.5
        ? Color3.Lerp(nightColor, duskColor, k * 2)
        : Color3.Lerp(duskColor, dayColor, (k - 0.5) * 2);
    this.directionalSunLight.diffuse = color;
    this.directionalSunLight.specular = color;
  }
}
