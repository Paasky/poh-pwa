<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";
import { toggleFullscreen } from "@/helpers/fullscreen";
import UiButton from "@/components/Ui/UiButton.vue";
import { useSettingsStore } from "@/stores/settingsStore";
import { useAppStore } from "@/stores/appStore";
import {
  EngineOptionPresets,
  type EngineOptions,
  RestartRequiredOptionKeys,
} from "@/components/Engine/EngineService";
import { defaultTimeOfDay2400 } from "@/components/Engine/environments/timeOfDay";
import { defaultSeasonMonth1to12 } from "@/components/Engine/environments/season";
import { defaultWeatherType, WeatherType } from "@/components/Engine/environments/weather";

const emit = defineEmits(["quit", "reload"]);
const showQuitConfirm = ref(false);
const showSettings = ref(false);
const isSavingSettings = ref(false); // prevent double-clicks and allow UI to show loading state
const settingsTab = ref<"game" | "graphics">(useSettingsStore().lastSettingsTab ?? "game");

const app = useAppStore();
// todo settings store should load values from browser storage, falling back to default per option
const settings = useSettingsStore();

// todo should this be in settingsStore using Pinia-built-in functionality/simple public backup() & reset() api?
// Local editable copy for the dialog
const localPresetId = ref<string>(settings.selectedPresetId);
const local = reactive<EngineOptions>({ ...settings.engine });

// Backups captured on open (used for Cancel/Revert)
let engineBackup: EngineOptions = { ...settings.engine };
let backupPresetId: string = settings.selectedPresetId;
let gameBackup = {
  timeOfDay2400: defaultTimeOfDay2400 as number,
  isClockRunning: false as boolean,
  seasonMonth1to12: defaultSeasonMonth1to12 as number,
  weatherType: defaultWeatherType as WeatherType,
  manualTilt: settings.engine.manualTilt ?? false,
  showGrid: settings.engine.showGrid ?? true,
  logicDebug: false as boolean,
};

// todo use settingsStore for this
// Environment local state (simple, non-persistent for MVP)
const localTimeOfDayValue2400 = ref<number>(defaultTimeOfDay2400);
const localIsClockRunning = ref<boolean>(false);
const localSeasonMonthIndex1to12 = ref<number>(defaultSeasonMonth1to12);
const localWeatherType = ref<WeatherType>(defaultWeatherType);

// Debug toggles (live, not persisted in EngineOptions)
const localLogicDebugEnabled = ref(false);

watch(
  () => showSettings.value,
  (open) => {
    if (open) {
      // Initialize from persisted settings as a base
      localPresetId.value = settings.selectedPresetId;
      Object.assign(local, settings.engine);
      // Sync with live engine state so UI reflects what the player sees
      try {
        const opts = app.engineService.getOptions();
        local.manualTilt = !!opts.manualTilt;
        local.showGrid = !!opts.showGrid;
        localTimeOfDayValue2400.value = app.engineService.getEffectiveTimeOfDay2400();
        localIsClockRunning.value = app.engineService.getIsClockRunning();
        localSeasonMonthIndex1to12.value = app.engineService.getSeasonMonth1to12();
        localWeatherType.value = app.engineService.getWeatherType();
      } catch {
        // Fallback to defaults if engine not ready
        localTimeOfDayValue2400.value = defaultTimeOfDay2400;
        localIsClockRunning.value = false;
        localSeasonMonthIndex1to12.value = defaultSeasonMonth1to12;
        localWeatherType.value = defaultWeatherType;
      }
      // Capture backups after sync
      engineBackup = { ...settings.engine };
      backupPresetId = settings.selectedPresetId;
      gameBackup = {
        timeOfDay2400: localTimeOfDayValue2400.value,
        isClockRunning: localIsClockRunning.value,
        seasonMonth1to12: localSeasonMonthIndex1to12.value,
        weatherType: localWeatherType.value,
        manualTilt: local.manualTilt ?? false,
        showGrid: local.showGrid ?? true,
        logicDebug: localLogicDebugEnabled.value,
      };
      // Set tab from last persisted value
      settingsTab.value = settings.lastSettingsTab ?? "game";
    }
  },
);

// Persist last-selected tab
watch(
  () => settingsTab.value,
  (tab) => {
    if (tab === "game" || tab === "graphics") {
      settings.lastSettingsTab = tab;
      settings.save();
    }
  },
);

function onPresetChange(id: string) {
  const preset = EngineOptionPresets.find((p) => p.id === id);
  // always always everywhere when input is invalid: throw! not return
  // -> returning is percieved as "why does it not do anything"; throwing can be caught and helpful info shown to user
  if (!preset) return;
  // Apply preset values into local
  Object.assign(local, preset.value);
}

const restartNote = "(requires restart)";
const restartKeys = new Set<keyof EngineOptions>(RestartRequiredOptionKeys);

// Save flow
const showRestartConfirm = ref(false);
let _pendingSave = false;

// --- Per-tab UX helpers ---
const graphicsOptionKeys: (keyof EngineOptions)[] = [
  "renderScale",
  "fpsCap",
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

const isGameDirty = computed(() => {
  return (
    (local.manualTilt ?? false) !== (gameBackup.manualTilt ?? false) ||
    (local.showGrid ?? true) !== (gameBackup.showGrid ?? true) ||
    localTimeOfDayValue2400.value !== gameBackup.timeOfDay2400 ||
    localIsClockRunning.value !== gameBackup.isClockRunning ||
    localSeasonMonthIndex1to12.value !== gameBackup.seasonMonth1to12 ||
    localWeatherType.value !== gameBackup.weatherType ||
    localLogicDebugEnabled.value !== gameBackup.logicDebug
  );
});

const isGraphicsDirty = computed(() => {
  if (localPresetId.value !== backupPresetId) return true;
  for (const k of graphicsOptionKeys) {
    if (local[k] !== engineBackup[k]) return true;
  }
  return false;
});

function buildGraphicsPatch(): Partial<EngineOptions> {
  return {
    renderScale: local.renderScale,
    fpsCap: local.fpsCap,
    adaptToDeviceRatio: local.adaptToDeviceRatio,
    antialias: local.antialias,
    preserveDrawingBuffer: local.preserveDrawingBuffer,
    stencil: local.stencil,
    disableWebGL2Support: local.disableWebGL2Support,
    powerPreference: local.powerPreference,
    hdr: local.hdr,
    useFxaa: local.useFxaa,
    useBloom: local.useBloom,
    bloomThreshold: local.bloomThreshold,
    bloomWeight: local.bloomWeight,
  };
}

function revertGame() {
  try {
    // Engine options
    local.manualTilt = gameBackup.manualTilt;
    local.showGrid = gameBackup.showGrid;
    app.engineService.applyOptions({
      manualTilt: !!gameBackup.manualTilt,
      showGrid: !!gameBackup.showGrid,
    });
    // Persist engine options to settings store
    settings.engine.manualTilt = !!gameBackup.manualTilt;
    settings.engine.showGrid = !!gameBackup.showGrid;
    // Environment
    localTimeOfDayValue2400.value = gameBackup.timeOfDay2400;
    localIsClockRunning.value = gameBackup.isClockRunning;
    localSeasonMonthIndex1to12.value = gameBackup.seasonMonth1to12;
    localWeatherType.value = gameBackup.weatherType;
    app.engineService.setTimeOfDay(gameBackup.timeOfDay2400);
    app.engineService.setIsClockRunning(gameBackup.isClockRunning);
    app.engineService.setSeason(gameBackup.seasonMonth1to12);
    app.engineService.setWeather(gameBackup.weatherType);
    // Persist environment to settings store
    settings.environment.timeOfDay2400 = gameBackup.timeOfDay2400;
    settings.environment.isClockRunning = gameBackup.isClockRunning;
    settings.environment.seasonMonth1to12 = gameBackup.seasonMonth1to12;
    settings.environment.weatherType = gameBackup.weatherType;
    // Debug
    localLogicDebugEnabled.value = gameBackup.logicDebug;
    app.engineService.setLogicDebugEnabled(!!gameBackup.logicDebug);
    // Save all persisted settings
    settings.save();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to revert game settings:", err);
  }
}

function onCancelGame() {
  revertGame();
  showSettings.value = false;
}

function onCloseGame() {
  showSettings.value = false;
}

// --- Game tab: immediate-apply setters that also persist to settingsStore ---
function setShowGrid(v: boolean | null) {
  const val = !!v;
  local.showGrid = val;
  try {
    app.engineService.applyOptions({ showGrid: val });
  } finally {
    settings.engine.showGrid = val;
    settings.save();
  }
}

function setManualTilt(v: boolean | null) {
  const val = !!v;
  local.manualTilt = val;
  try {
    app.engineService.applyOptions({ manualTilt: val });
  } finally {
    settings.engine.manualTilt = val;
    settings.save();
  }
}

function setTimeOfDayPersist(v: number) {
  localTimeOfDayValue2400.value = v;
  try {
    app.engineService.setTimeOfDay(v);
  } finally {
    settings.environment.timeOfDay2400 = v;
    settings.save();
  }
}

function setClockRunningPersist(v: boolean | null) {
  const val = !!v;
  localIsClockRunning.value = val;
  try {
    app.engineService.setIsClockRunning(val);
  } finally {
    settings.environment.isClockRunning = val;
    settings.save();
  }
}

function setSeasonPersist(v: number) {
  localSeasonMonthIndex1to12.value = v;
  try {
    app.engineService.setSeason(v);
  } finally {
    settings.environment.seasonMonth1to12 = v;
    settings.save();
  }
}

function setWeatherPersist(v: WeatherType) {
  localWeatherType.value = v;
  try {
    app.engineService.setWeather(v);
  } finally {
    settings.environment.weatherType = v;
    settings.save();
  }
}

function revertGraphics() {
  try {
    localPresetId.value = backupPresetId;
    Object.assign(local, { ...engineBackup });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to revert graphics settings:", err);
  }
}

function onCancelGraphics() {
  revertGraphics();
  showSettings.value = false;
}

function onApplyGraphics() {
  if (isSavingSettings.value) return;
  // Determine if any restart-required options are modified (relative to dialog-open backup)
  const changedRestart: (keyof EngineOptions)[] = [];
  for (const k of restartKeys) {
    if (engineBackup[k] !== local[k]) changedRestart.push(k);
  }
  if (changedRestart.length > 0) {
    _pendingSave = true;
    showRestartConfirm.value = true;
    return;
  }
  // Persist settings first (cheap), close dialog to let UI update, then apply engine changes in RAF
  isSavingSettings.value = true;
  try {
    settings.selectedPresetId = localPresetId.value;
    // Persist only graphics-related keys (Game tab applies immediately but persistence is separate)
    Object.assign(settings.engine, buildGraphicsPatch());
    settings.save();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to save settings:", err);
  }
  showSettings.value = false;
  requestAnimationFrame(() => {
    try {
      if (app.engineService && typeof app.engineService.applyOptions === "function") {
        // Apply live-only graphics options immediately
        const patch = buildGraphicsPatch();
        app.engineService.applyOptions(patch as EngineOptions);
      }
      if (
        app.engineService &&
        typeof app.engineService.setEnvironmentPostProcessingOptions === "function"
      ) {
        app.engineService.setEnvironmentPostProcessingOptions({
          enableFastApproximateAntialiasing: !!local.useFxaa,
          enableBloom: !!local.useBloom,
          bloomThreshold:
            typeof local.bloomThreshold === "number" ? local.bloomThreshold : undefined,
          bloomWeight: typeof local.bloomWeight === "number" ? local.bloomWeight : undefined,
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to apply graphics settings:", err);
    } finally {
      isSavingSettings.value = false;
    }
  });
}

function confirmRestartProceed() {
  showRestartConfirm.value = false;
  if (!_pendingSave) return;
  _pendingSave = false;
  settings.selectedPresetId = localPresetId.value;
  Object.assign(settings.engine, buildGraphicsPatch());
  settings.save();
  // Ask parent to reload app (recreate engine)
  emit("reload");
}

function confirmRestartCancel() {
  _pendingSave = false;
  showRestartConfirm.value = false;
}

// todo in <template>:
// wire up to settingsStore
// - separate tabs for "Game" & "Graphics"
// - buttons: [Cancel] [Reset]
// - Game: Tilt, time/season/weather (auto or manual set). These are set immediately (no save button).
// - Graphics: All rendering settings. These are set on save (show [Save] after [Reset])
</script>

<template>
  <div class="d-flex ga-2">
    <UiButton
      icon="fa-question"
      color="secondary"
      rounded="0"
      class="rounded-b-lg"
      tooltip="Encyclopedia"
      @click="useEncyclopediaStore().open()"
    />
    <UiButton
      icon="fa-up-right-and-down-left-from-center"
      color="secondary"
      rounded="0"
      class="rounded-b-lg"
      tooltip="Toggle Fullscreen"
      @click="toggleFullscreen()"
    />
    <UiButton
      id="menu-btn"
      icon="fa-bars"
      color="secondary"
      rounded="0"
      class="rounded-b-lg"
      tooltip="Menu"
    />
    <v-menu activator="#menu-btn" transition="slide-y-transition">
      <v-list density="comfortable">
        <v-list-item value="save" title="Save" />
        <v-list-item value="load" title="Load" />
        <v-list-item value="settings" title="Settings" @click="showSettings = true" />
        <v-divider class="my-1" />
        <v-list-item value="quit" title="Quit" @click="showQuitConfirm = true" />
      </v-list>
    </v-menu>

    <!-- Settings dialog -->
    <v-dialog v-model="showSettings" max-width="820" scrollable>
      <v-card rounded="lg">
        <v-card-title class="text-h6">Settings</v-card-title>
        <v-card-subtitle>
          Rendering and visual effects. Items marked {{ restartNote }} will restart the engine to
          take effect.
        </v-card-subtitle>
        <v-divider class="my-2" />
        <v-card-text class="d-flex flex-column ga-5">
          <v-tabs v-model="settingsTab" color="primary" class="mb-4">
            <v-tab value="game">Game</v-tab>
            <v-tab value="graphics">Graphics</v-tab>
          </v-tabs>

          <v-window v-model="settingsTab">
            <!-- Game tab -->
            <v-window-item value="game">
              <div class="d-flex flex-column ga-5">
                <!-- Overlays & Layers -->
                <div>
                  <div class="text-subtitle-2 mb-2">Overlays & Layers</div>
                  <div class="d-flex flex-wrap ga-4">
                    <v-switch
                      v-model="local.showGrid"
                      label="Show Grid"
                      inset
                      @update:model-value="setShowGrid"
                    />
                  </div>
                </div>

                <!-- Environment (managed by EnvironmentService) -->
                <div>
                  <div class="text-subtitle-2 mb-2">Environment</div>
                  <div class="d-flex flex-column ga-4">
                    <div class="d-flex flex-wrap ga-4">
                      <v-slider
                        class="flex-1-1"
                        min="0"
                        max="2400"
                        step="25"
                        thumb-label
                        v-model.number="localTimeOfDayValue2400"
                        label="Time of day (0-2400)"
                        hint="24h clock encoded as 0..2400 (e.g., 1430 = 2:30 PM)"
                        persistent-hint
                        @update:model-value="setTimeOfDayPersist"
                      />
                      <v-switch
                        v-model="localIsClockRunning"
                        label="Run environment clock"
                        inset
                        @update:model-value="setClockRunningPersist"
                      />
                    </div>
                    <div class="d-flex flex-wrap ga-4">
                      <v-select
                        :items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
                        v-model.number="localSeasonMonthIndex1to12"
                        label="Season month (1..12)"
                        density="comfortable"
                        @update:model-value="setSeasonPersist"
                      />
                      <v-select
                        :items="[
                          { title: 'Sunny', value: WeatherType.Sunny },
                          { title: 'Half-Cloud', value: WeatherType.HalfCloud },
                          { title: 'Foggy', value: WeatherType.Foggy },
                          { title: 'Rainy', value: WeatherType.Rainy },
                          { title: 'Thunderstorm', value: WeatherType.Thunderstorm },
                        ]"
                        item-title="title"
                        item-value="value"
                        v-model="localWeatherType"
                        label="Weather"
                        density="comfortable"
                        @update:model-value="setWeatherPersist"
                      />
                    </div>
                  </div>
                </div>

                <!-- Camera UX -->
                <div>
                  <div class="text-subtitle-2 mb-2">Camera</div>
                  <v-switch
                    v-model="local.manualTilt"
                    label="Manual tilt (disable auto-tilt)"
                    inset
                    @update:model-value="setManualTilt"
                  />
                </div>

                <!-- Debug -->
                <div>
                  <div class="text-subtitle-2 mb-2">Debug</div>
                  <v-switch
                    v-model="localLogicDebugEnabled"
                    label="Logic mesh debug overlay"
                    inset
                    @update:model-value="
                      (v: boolean | null) => app.engineService.setLogicDebugEnabled(!!v)
                    "
                  />
                </div>
              </div>
            </v-window-item>

            <!-- Graphics tab -->
            <v-window-item value="graphics">
              <div class="d-flex flex-column ga-5">
                <!-- Preset -->
                <div>
                  <div class="text-subtitle-2 mb-2">Preset</div>
                  <v-select
                    :items="EngineOptionPresets"
                    item-title="label"
                    item-value="id"
                    v-model="localPresetId"
                    label="Quality Preset"
                    density="comfortable"
                    @update:model-value="onPresetChange"
                  />
                </div>

                <!-- Resolution & Performance -->
                <div>
                  <div class="text-subtitle-2 mb-2">Resolution & Performance</div>
                  <div class="d-flex flex-wrap ga-4">
                    <v-slider
                      class="flex-1-1"
                      min="0.5"
                      max="2"
                      step="0.05"
                      thumb-label="always"
                      v-model.number="local.renderScale"
                      label="Render scale"
                      hint="Lower for performance (0.5), higher for clarity (1.25)."
                      persistent-hint
                    />
                    <v-text-field
                      class="flex-1-1"
                      type="number"
                      min="0"
                      step="1"
                      v-model.number="local.fpsCap"
                      label="FPS cap (0 = uncapped)"
                    />
                    <v-switch
                      v-model="local.adaptToDeviceRatio"
                      :label="`Adapt to device pixel ratio ${restartNote}`"
                      inset
                    />
                  </div>
                </div>

                <!-- Engine / GPU Context (restart) -->
                <div>
                  <div class="text-subtitle-2 mb-2">GPU Context</div>
                  <div class="d-flex flex-wrap ga-4">
                    <v-switch v-model="local.antialias" :label="`Antialias ${restartNote}`" inset />
                    <v-switch
                      v-model="local.preserveDrawingBuffer"
                      :label="`Preserve drawing buffer ${restartNote}`"
                      inset
                    />
                    <v-switch
                      v-model="local.stencil"
                      :label="`Stencil buffer ${restartNote}`"
                      inset
                    />
                    <v-switch
                      v-model="local.disableWebGL2Support"
                      :label="`Disable WebGL2 ${restartNote}`"
                      inset
                    />
                    <v-select
                      :items="['default', 'high-performance', 'low-power']"
                      v-model="local.powerPreference"
                      :label="`Power preference ${restartNote}`"
                      density="comfortable"
                    />
                  </div>
                </div>

                <!-- Visual effects -->
                <div>
                  <div class="text-subtitle-2 mb-2">Visual effects</div>
                  <div class="d-flex flex-wrap ga-4">
                    <v-switch v-model="local.hdr" label="HDR" inset />
                    <v-switch v-model="local.useFxaa" label="FXAA" inset />
                    <v-switch v-model="local.useBloom" label="Bloom" inset />
                    <v-slider
                      class="flex-1-1"
                      min="0"
                      max="1"
                      step="0.01"
                      thumb-label
                      :disabled="!local.useBloom"
                      v-model.number="local.bloomThreshold"
                      label="Bloom threshold"
                    />
                    <v-slider
                      class="flex-1-1"
                      min="0"
                      max="1"
                      step="0.01"
                      thumb-label
                      :disabled="!local.useBloom"
                      v-model.number="local.bloomWeight"
                      label="Bloom weight"
                    />
                  </div>
                </div>
              </div>
            </v-window-item>
          </v-window>
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-space-between ga-2 flex-wrap">
          <div class="text-caption text-medium-emphasis">
            <template v-if="settingsTab === 'graphics'">
              <span v-if="isGraphicsDirty">You have unapplied changes</span>
              <span v-else>No pending changes</span>
            </template>
            <template v-else>
              <span v-if="isGameDirty">Changes take effect immediately</span>
              <span v-else>No changes</span>
            </template>
          </div>
          <div class="d-flex ga-2">
            <template v-if="settingsTab === 'game'">
              <v-btn variant="text" @click="onCancelGame">Cancel</v-btn>
              <v-btn variant="text" :disabled="!isGameDirty" @click="revertGame">Revert</v-btn>
              <v-btn color="primary" variant="flat" @click="onCloseGame">Close</v-btn>
            </template>
            <template v-else>
              <v-btn variant="text" @click="onCancelGraphics">Cancel</v-btn>
              <v-btn variant="tonal" :disabled="!isGraphicsDirty" @click="revertGraphics"
                >Revert</v-btn
              >
              <v-btn
                color="primary"
                variant="flat"
                :disabled="!isGraphicsDirty"
                @click="onApplyGraphics"
                >Apply</v-btn
              >
            </template>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Restart confirmation dialog -->
    <v-dialog v-model="showRestartConfirm" max-width="520" persistent>
      <v-card rounded="lg">
        <v-card-title class="text-h6">Restart Required</v-card-title>
        <v-card-text>
          Some changed settings require an engine restart to take effect. Reload the game now?
        </v-card-text>
        <v-card-actions class="justify-end ga-2">
          <v-btn variant="text" @click="confirmRestartCancel">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="confirmRestartProceed">Reload</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Quit confirmation dialog -->
    <v-dialog v-model="showQuitConfirm" max-width="378" persistent>
      <v-card rounded="lg">
        <v-card-title class="text-h6">Confirm Quit</v-card-title>
        <v-card-text>
          Are you sure you want to Quit?<br />
          Unsaved progress may be lost.
        </v-card-text>
        <v-card-actions class="justify-end ga-2">
          <v-btn variant="text" @click="showQuitConfirm = false">Cancel</v-btn>
          <v-btn color="red" variant="flat" @click="$emit('quit')">Quit</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped></style>
