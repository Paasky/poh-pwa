/**
 * Weather types and defaults.
 * These are intentionally simple for the initial scaffold, but provide
 * a stable enum that the EnvironmentService can consume.
 */

export enum WeatherType {
  Sunny = "Sunny",
  HalfCloud = "HalfCloud",
  Foggy = "Foggy",
  Rainy = "Rainy",
  Thunderstorm = "Thunderstorm",
}

/** Default weather type (clear day). */
export const defaultWeatherType: WeatherType = WeatherType.Sunny;
