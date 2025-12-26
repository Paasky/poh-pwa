import { WeatherType } from "@/engine/environment/Environment";

export type EngineSettings = {
  // Camera UX
  manualTilt: boolean; // Allow user to tilt manually (otherwise auto-tilt by zoom)

  // Overlays
  showGrid: boolean; // Show/hide hex grid overlay
  showClock: boolean; // Show/hide clock in UI
  enableDebug: boolean; // Show/hide hex grid overlay
  enableFogOfWar: boolean; // Show/hide hex grid overlay

  // Environment
  timeOfDay2400: number;
  isClockRunning: boolean;
  month: number;
  weatherType: WeatherType;

  // Resolution & performance
  renderScale: number; // 1 = native CSS resolution, 0.5 = half res, 1.25 = super-sample
  adaptToDeviceRatio: boolean; // Use devicePixelRatio for base resolution (restart required)

  // PohEngine/GPU flags (restart required)
  antialias: boolean; // Multi-sample antialias at context level (restart required)
  preserveDrawingBuffer: boolean;
  stencil: boolean;
  disableWebGL2Support: boolean; // Force WebGL1 if true
  powerPreference: WebGLPowerPreference; // "default" | "high-performance" | "low-power"

  // Visual effects (post-process pipeline)
  // todo allow disabling all post-processing (enablePostProcessing)
  hdr: boolean; // Enable HDR pipeline when supported  (restart required)
  useFxaa: boolean; // FXAA post-process
  useBloom: boolean; // Bloom post-process
  bloomThreshold: number; // 0..1
  bloomWeight: number; // 0..1
};

export const gameSettingKeys: (keyof EngineSettings)[] = [
  "manualTilt",
  "showGrid",
  "showClock",
  "enableDebug",
  "enableFogOfWar",
  "timeOfDay2400",
  "isClockRunning",
  "month",
  "weatherType",
];

export const graphicsSettingKeys: (keyof EngineSettings)[] = [
  "renderScale",
  "adaptToDeviceRatio",
  "antialias",
  "preserveDrawingBuffer",
  "stencil",
  "disableWebGL2Support",
  "powerPreference",
  "hdr",
  "useFxaa",
  "useBloom",
  "bloomThreshold",
  "bloomWeight",
];

export const restartRequiredSettingKeys: (keyof EngineSettings)[] = [
  "adaptToDeviceRatio",
  "antialias",
  "preserveDrawingBuffer",
  "stencil",
  "disableWebGL2Support",
  "powerPreference",
  "hdr",
];

// This is the same as "high" preset
export const defaultEngineSettings: Required<EngineSettings> = {
  manualTilt: false,
  showGrid: true,
  showClock: true,
  enableDebug: false,
  enableFogOfWar: true,
  renderScale: 1,
  adaptToDeviceRatio: false,
  antialias: true,
  preserveDrawingBuffer: true,
  stencil: true,
  disableWebGL2Support: false,
  powerPreference: "high-performance",
  hdr: true,
  useFxaa: true,
  useBloom: true,
  bloomThreshold: 0.9,
  bloomWeight: 0.15,
  timeOfDay2400: 1200,
  isClockRunning: true,
  month: 6,
  weatherType: "Sunny" as WeatherType,
};

export const engineSettingPresets: { id: string; label: string; value: EngineSettings }[] = [
  {
    id: "low",
    label: "Low",
    value: {
      ...defaultEngineSettings,
      renderScale: 0.5,
      antialias: false,
      preserveDrawingBuffer: false,
      stencil: false,
      powerPreference: "low-power",
      hdr: false,
      useFxaa: false,
      useBloom: false,
    },
  },
  {
    id: "medium",
    label: "Medium",
    value: {
      ...defaultEngineSettings,
      renderScale: 0.75,
      preserveDrawingBuffer: false,
      stencil: false,
      powerPreference: "default",
      hdr: false,
      useBloom: false,
    },
  },
  {
    id: "high",
    label: "High",
    value: defaultEngineSettings,
  },
  {
    id: "ultra",
    label: "Ultra",
    value: {
      ...defaultEngineSettings,
      adaptToDeviceRatio: true,
      bloomThreshold: 0.85,
      bloomWeight: 0.2,
    },
  },
];
