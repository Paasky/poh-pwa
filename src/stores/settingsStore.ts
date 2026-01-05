import pkg from "../../package.json";
import { defineStore } from "pinia";
import { loadFromBrowser, saveToBrowser } from "@/utils/persistentStorage";
import {
  defaultEngineSettings,
  EngineSettings,
  gameSettingKeys,
} from "@/Actor/Human/EngineSettings";

const STORAGE_KEY = "poh.settings";
const STORAGE_VERSION = pkg.version;

export type SettingsData = {
  engineSettings: EngineSettings;
  selectedPresetId: string; // one of engineSettingPresets ids
};

function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T;
}

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    ready: false,
    selectedPresetId: "high",
    engineSettings: { ...defaultEngineSettings } as EngineSettings,
    tab: "game" as "game" | "graphics",
  }),
  actions: {
    init() {
      if (this.ready) return;

      const prevSettings = loadFromBrowser<SettingsData>(STORAGE_KEY, STORAGE_VERSION);
      if (prevSettings) {
        this.selectedPresetId = prevSettings.selectedPresetId ?? "high";
        Object.assign(
          this.engineSettings,
          defaultEngineSettings,
          prevSettings.engineSettings ?? {},
        );
      }

      // Auto-save settings on mutation
      const snapshotGame = (): Record<string, unknown> => {
        const s: Record<string, unknown> = {};
        for (const k of gameSettingKeys) s[k] = this.engineSettings[k];
        return s;
      };

      let prevGameSnap = snapshotGame();
      let pendingAutosave: ReturnType<typeof setTimeout> | null = null;

      this.$subscribe(() => {
        const nextSnap = snapshotGame();
        let changed = false;
        for (const k of gameSettingKeys) {
          if (prevGameSnap[k] !== nextSnap[k]) {
            changed = true;
            break;
          }
        }
        // Coalesce multiple rapid mutations (e.g., Object.assign during revert)
        if (changed && !pendingAutosave) {
          pendingAutosave = setTimeout(() => {
            this.save();
            pendingAutosave = null;
          }, 10);
        }
        prevGameSnap = nextSnap;
      });

      this.ready = true;
    },
    save() {
      const data: SettingsData = {
        selectedPresetId: this.selectedPresetId,
        engineSettings: clone(this.engineSettings),
      };
      saveToBrowser(STORAGE_KEY, STORAGE_VERSION, data);
    },
  },
});
