import { defineStore } from "pinia";
import { reactive } from "vue";
import type { EngineOptions } from "@/components/Engine/EngineService";
import {
  DefaultEngineOptions,
  type EngineOptionPreset,
  EngineOptionPresets,
  RestartRequiredOptionKeys,
} from "@/components/Engine/EngineService";
import { loadPersisted, savePersisted } from "@/utils/persistentStorage";
import { defaultTimeOfDay2400 } from "@/components/Engine/environments/timeOfDay";
import { defaultSeasonMonth1to12 } from "@/components/Engine/environments/season";
import { defaultWeatherType, type WeatherType } from "@/components/Engine/environments/weather";

const STORAGE_KEY = "poh.settings";
const STORAGE_VERSION = 1;

export type SettingsData = {
  selectedPresetId: string; // one of EngineOptionPresets ids
  engine: EngineOptions;
  lastSettingsTab?: "game" | "graphics";
  environment?: {
    timeOfDay2400: number;
    isClockRunning: boolean;
    seasonMonth1to12: number;
    weatherType: WeatherType;
  };
};

function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T;
}

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    ready: false,
    selectedPresetId: "high",
    engine: reactive({ ...DefaultEngineOptions }) as EngineOptions,
    lastSettingsTab: "game" as "game" | "graphics",
    environment: reactive({
      timeOfDay2400: defaultTimeOfDay2400,
      isClockRunning: false,
      seasonMonth1to12: defaultSeasonMonth1to12,
      weatherType: defaultWeatherType as WeatherType,
    }),
  }),
  actions: {
    init() {
      if (this.ready) return;

      const saved = loadPersisted<SettingsData>(STORAGE_KEY, STORAGE_VERSION);
      if (saved) {
        this.selectedPresetId = saved.selectedPresetId ?? "high";
        this.engine = reactive({ ...DefaultEngineOptions, ...(saved.engine ?? {}) });
        this.lastSettingsTab = (saved.lastSettingsTab as any) === "graphics" ? "graphics" : "game";
        // Environment (game settings)
        const env = saved.environment;
        if (env) {
          this.environment = reactive({
            timeOfDay2400:
              typeof env.timeOfDay2400 === "number" ? env.timeOfDay2400 : defaultTimeOfDay2400,
            isClockRunning: !!env.isClockRunning,
            seasonMonth1to12:
              typeof env.seasonMonth1to12 === "number"
                ? env.seasonMonth1to12
                : defaultSeasonMonth1to12,
            weatherType: (env.weatherType ?? defaultWeatherType) as WeatherType,
          });
        }
      } else {
        // todo select depending on a quick specs-check
        // Default to High preset
        const preset = EngineOptionPresets.find((p) => p.id === "high") as EngineOptionPreset;
        this.selectedPresetId = preset.id;
        this.engine = reactive({ ...DefaultEngineOptions, ...clone(preset.value) });
      }
      this.ready = true;
    },
    save() {
      const data: SettingsData = {
        selectedPresetId: this.selectedPresetId,
        engine: clone(this.engine),
        lastSettingsTab: this.lastSettingsTab,
        environment: clone(this.environment),
      };
      savePersisted(STORAGE_KEY, STORAGE_VERSION, data);
    },
    setPreset(id: string) {
      const preset = EngineOptionPresets.find((p) => p.id === id);
      if (!preset) return;
      this.selectedPresetId = id;
      Object.assign(this.engine, clone(preset.value));
    },
    diffRestartRequired(prev: EngineOptions, next: EngineOptions): (keyof EngineOptions)[] {
      const changed: (keyof EngineOptions)[] = [];
      for (const k of RestartRequiredOptionKeys) {
        if (prev[k] !== next[k]) changed.push(k);
      }
      return changed;
    },
  },
});
