/**
 * Time-of-day lighting configuration and Helpers.
 * KISS: one place with simple, verbose names; EnvironmentService only applies values.
 */
import { Color3, Vector3 } from "@babylonjs/core";

/** Default time of day (24h clock encoded as 0..2400). */
export const defaultTimeOfDay2400: number = 1200; // 12:00 PM

/** Lighting state values that EnvironmentService directly applies. */
export interface TimeOfDayLightingState {
  sunDirection: Vector3; // direction the directional light points to
  sunStrength01: number; // 0..1 scalar, caller may scale with its own base/multipliers
  sunColor: Color3;
  ambientIntensity: number; // absolute intensity for hemispheric ambient light
  ambientSkyColor: Color3;
  ambientGroundColor: Color3;
}

/**
 * Keyframe configuration for four times of day.
 * Times use a 24h 0..2400 clock. We include 2400 as a wrap of 0 with a 360° yaw for smooth rotation.
 */
type Keyframe = {
  time2400: number;
  // Sun orientation in intuitive terms
  yawDegreesAroundY: number; // 0..360 rotation over the day (visual spin around Y)
  heightDegreesAboveHorizon: number; // how high the sun is; negative = below horizon
  // Sun brightness and color
  sunStrength01: number; // 0 at night; 1 at brightest
  sunColor: Color3;
  // Ambient/"moon glow" to avoid fully dark nights
  ambientIntensity: number;
  ambientSkyColor: Color3;
  ambientGroundColor: Color3;
};

const sunriseWarm = Color3.FromHexString("#ffb36a");
const sunsetWarm = Color3.FromHexString("#ff9460");
const middayWhite = Color3.FromHexString("#ffffff");
const nightBlue = Color3.FromHexString("#9fb8ff");
const nightGroundBlue = Color3.FromHexString("#5e6fa3");

const keyframes: Keyframe[] = [
  // 0: midnight — sun below horizon, ambient moon glow
  {
    time2400: 0,
    yawDegreesAroundY: 0,
    heightDegreesAboveHorizon: 5,
    sunStrength01: 0.25,
    sunColor: nightBlue.scale(0.6),
    ambientIntensity: 0.3,
    ambientSkyColor: nightBlue.clone(),
    ambientGroundColor: nightGroundBlue.clone(),
  },
  // 600: sunrise
  {
    time2400: 600,
    yawDegreesAroundY: 90,
    heightDegreesAboveHorizon: 10,
    sunStrength01: 0.45,
    sunColor: sunriseWarm.clone(),
    ambientIntensity: 0.35,
    ambientSkyColor: Color3.Lerp(nightBlue, sunriseWarm, 0.4),
    ambientGroundColor: Color3.Lerp(nightGroundBlue, sunriseWarm, 0.2),
  },
  // 900: start of full daylight (lower midday to keep shadows)
  {
    time2400: 900,
    yawDegreesAroundY: 135,
    heightDegreesAboveHorizon: 30,
    sunStrength01: 1.0,
    sunColor: middayWhite.clone(),
    ambientIntensity: 0.25,
    ambientSkyColor: Color3.FromHexString("#d7ecff"),
    ambientGroundColor: Color3.FromHexString("#cbd7e6"),
  },
  // 1200: midday peak (keep rotation continuity but lower height to keep shadows)
  {
    time2400: 1200,
    yawDegreesAroundY: 180,
    heightDegreesAboveHorizon: 40,
    sunStrength01: 1.0,
    sunColor: middayWhite.clone(),
    ambientIntensity: 0.25,
    ambientSkyColor: Color3.FromHexString("#d7ecff"),
    ambientGroundColor: Color3.FromHexString("#cbd7e6"),
  },
  // 1500: end of full daylight
  {
    time2400: 1500,
    yawDegreesAroundY: 225,
    heightDegreesAboveHorizon: 30,
    sunStrength01: 1.0,
    sunColor: middayWhite.clone(),
    ambientIntensity: 0.25,
    ambientSkyColor: Color3.FromHexString("#d7ecff"),
    ambientGroundColor: Color3.FromHexString("#cbd7e6"),
  },
  // 1800: sunset
  {
    time2400: 1800,
    yawDegreesAroundY: 270,
    heightDegreesAboveHorizon: 10,
    sunStrength01: 0.45,
    sunColor: sunsetWarm.clone(),
    ambientIntensity: 0.35,
    ambientSkyColor: Color3.Lerp(sunsetWarm, nightBlue, 0.3),
    ambientGroundColor: Color3.Lerp(sunsetWarm, nightGroundBlue, 0.5),
  },
  // 2400: midnight wrap — same as 0 but with 360° yaw for smooth spin
  {
    time2400: 2400,
    yawDegreesAroundY: 360,
    heightDegreesAboveHorizon: 5,
    sunStrength01: 0.25,
    sunColor: nightBlue.scale(0.6),
    ambientIntensity: 0.3,
    ambientSkyColor: nightBlue.clone(),
    ambientGroundColor: nightGroundBlue.clone(),
  },
];

function clampTime2400(value: number): number {
  const v = Math.round(value);
  if (v < 0) return 0;
  if (v > 2400) return 2400;
  return v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function directionFromYawHeight(yawDeg: number, heightDeg: number): Vector3 {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (heightDeg * Math.PI) / 180;
  const x = Math.cos(pitch) * Math.sin(yaw);
  const y = -Math.sin(pitch); // negative Y points downwards when sun is above
  const z = Math.cos(pitch) * Math.cos(yaw);
  return new Vector3(x, y, z);
}

/** Find the lower/upper keyframes around a given time and the blend alpha between them. */
function findBlend(time2400: number): { a: Keyframe; b: Keyframe; alpha01: number } {
  const t = clampTime2400(time2400);
  // Walk through consecutive pairs and find the segment that contains t
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (t >= a.time2400 && t <= b.time2400) {
      const span = b.time2400 - a.time2400;
      const alpha01 = span === 0 ? 0 : (t - a.time2400) / span;
      return { a, b, alpha01 };
    }
  }
  // Fallback (should not happen): use last pair
  const last = keyframes[keyframes.length - 2];
  const wrap = keyframes[keyframes.length - 1];
  return { a: last, b: wrap, alpha01: 0 };
}

/**
 * Produce lighting values for a given time-of-day. Smoothly blends between keyframes.
 * No environmental logic here beyond interpolation and conversion to final values.
 */
export function getLightingForTimeOfDay(time2400: number): TimeOfDayLightingState {
  const { a, b, alpha01 } = findBlend(time2400);

  // Interpolate angles (yaw can safely lerp because we modeled 2400 as 360°)
  const yaw = lerp(a.yawDegreesAroundY, b.yawDegreesAroundY, alpha01);
  const height = lerp(a.heightDegreesAboveHorizon, b.heightDegreesAboveHorizon, alpha01);

  // Build direction vector from angles
  const sunDirection = directionFromYawHeight(yaw, height);

  // Interpolate scalar and colors
  const sunStrength01 = lerp(a.sunStrength01, b.sunStrength01, alpha01);
  const sunColor = Color3.Lerp(a.sunColor, b.sunColor, alpha01);
  const ambientIntensity = lerp(a.ambientIntensity, b.ambientIntensity, alpha01);
  const ambientSkyColor = Color3.Lerp(a.ambientSkyColor, b.ambientSkyColor, alpha01);
  const ambientGroundColor = Color3.Lerp(a.ambientGroundColor, b.ambientGroundColor, alpha01);

  return {
    sunDirection,
    sunStrength01,
    sunColor,
    ambientIntensity,
    ambientSkyColor,
    ambientGroundColor,
  };
}
