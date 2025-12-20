/**
 * Weather types and defaults.
 * These are intentionally simple for the initial scaffold, but provide
 * a stable enum that the EnvironmentService can consume.
 */

import { Color3 } from "@babylonjs/core/Maths/math.color";

export enum WeatherType {
  Sunny = "Sunny",
  HalfCloud = "HalfCloud",
  Foggy = "Foggy",
  Rainy = "Rainy",
  Thunderstorm = "Thunderstorm",
}

/** Default weather type (clear day). */
export const defaultWeatherType: WeatherType = WeatherType.Sunny;

export type WeatherPreset = {
  fogDensity: number;
  fogColor: Color3;
  sunIntensityScale: number;
};

export const weatherPresets: Record<WeatherType, WeatherPreset> = {
  [WeatherType.Sunny]: {
    fogDensity: 0,
    fogColor: new Color3(0.8, 0.85, 0.95),
    sunIntensityScale: 1.0,
  },
  [WeatherType.HalfCloud]: {
    fogDensity: 0.002,
    fogColor: new Color3(0.75, 0.8, 0.9),
    sunIntensityScale: 0.85,
  },
  [WeatherType.Foggy]: {
    fogDensity: 0.02,
    fogColor: new Color3(0.75, 0.78, 0.84),
    sunIntensityScale: 0.6,
  },
  [WeatherType.Rainy]: {
    fogDensity: 0.01,
    fogColor: new Color3(0.63, 0.66, 0.71),
    sunIntensityScale: 0.75,
  },
  [WeatherType.Thunderstorm]: {
    fogDensity: 0.015,
    fogColor: new Color3(0.55, 0.58, 0.65),
    sunIntensityScale: 0.7,
  },
};
