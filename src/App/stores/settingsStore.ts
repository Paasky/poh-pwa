import { defineStore } from "pinia";
import { defaultEngineSettings, EngineSettings } from "@/Actor/Human/EngineSettings";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    ready: false,
    selectedPresetId: "high",
    engineSettings: { ...defaultEngineSettings } as EngineSettings,
    tab: "game" as "game" | "graphics",
  }),
  persist: {
    key: "poh.settings",
    storage: localStorage,
  },
});
