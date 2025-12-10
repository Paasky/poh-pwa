<script setup lang="ts">
import { reactive, ref, watch } from "vue";
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
const showOptions = ref(false);
const isSavingOptions = ref(false); // prevent double-clicks and allow UI to show loading state

const app = useAppStore();
// todo settings store should load values from browser storage, falling back to default per option
const settings = useSettingsStore();

// todo should this be in settingsStore using Pinia-built-in functionality/simple public backup() & reset() api?
// Local editable copy for the dialog
const localPresetId = ref<string>(settings.selectedPresetId);
const local = reactive<EngineOptions>({ ...settings.engine });

// Environment local state (simple, non-persistent for MVP)
const localTimeOfDayValue2400 = ref<number>(defaultTimeOfDay2400);
const localIsClockRunning = ref<boolean>(false);
const localSeasonMonthIndex1to12 = ref<number>(defaultSeasonMonth1to12);
const localWeatherType = ref<WeatherType>(defaultWeatherType);

watch(
  () => showOptions.value,
  (open) => {
    if (open) {
      // todo use settingsStore for this, no weird reset on open
      localPresetId.value = settings.selectedPresetId;
      Object.assign(local, settings.engine);
      localTimeOfDayValue2400.value = defaultTimeOfDay2400;
      localIsClockRunning.value = false;
      localSeasonMonthIndex1to12.value = defaultSeasonMonth1to12;
      localWeatherType.value = defaultWeatherType;
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

function onCancelOptions() {
  showOptions.value = false;
}

function onSaveOptions() {
  if (isSavingOptions.value) return; // guard re-entry
  // Determine if any restart-required options are modified
  const changedRestart: (keyof EngineOptions)[] = [];
  for (const k of restartKeys) {
    if (settings.engine[k] !== local[k]) changedRestart.push(k);
  }
  if (changedRestart.length > 0) {
    _pendingSave = true;
    showRestartConfirm.value = true;
    return;
  }
  // Persist settings first (cheap), close dialog to let UI update, then apply heavy engine changes in RAF
  isSavingOptions.value = true;
  try {
    settings.selectedPresetId = localPresetId.value;
    Object.assign(settings.engine, { ...local });
    settings.save();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to save settings:", err);
  }
  showOptions.value = false;
  // Defer engine updates to next frame to avoid blocking the interaction frame
  requestAnimationFrame(() => {
    try {
      if (app.engineService && typeof app.engineService.applyOptions === "function") {
        app.engineService.applyOptions({ ...local });
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
      if (app.engineService) {
        app.engineService.setTimeOfDay(localTimeOfDayValue2400.value);
        app.engineService.setIsClockRunning(localIsClockRunning.value);
        app.engineService.setSeason(localSeasonMonthIndex1to12.value);
        app.engineService.setWeather(localWeatherType.value);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to apply engine options:", err);
    } finally {
      isSavingOptions.value = false;
    }
  });
}

function confirmRestartProceed() {
  showRestartConfirm.value = false;
  if (!_pendingSave) return;
  _pendingSave = false;
  settings.selectedPresetId = localPresetId.value;
  Object.assign(settings.engine, { ...local });
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
        <v-list-item value="options" title="Options" @click="showOptions = true" />
        <v-divider class="my-1" />
        <v-list-item value="quit" title="Quit" @click="showQuitConfirm = true" />
      </v-list>
    </v-menu>

    <!-- Options dialog -->
    <v-dialog v-model="showOptions" max-width="820" scrollable>
      <v-card rounded="lg">
        <v-card-title class="text-h6">Options</v-card-title>
        <v-card-subtitle>
          Rendering and visual effects. Items marked {{ restartNote }} will restart the engine to
          take effect.
        </v-card-subtitle>
        <v-divider class="my-2" />
        <v-card-text class="d-flex flex-column ga-5">
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
              <v-switch v-model="local.stencil" :label="`Stencil buffer ${restartNote}`" inset />
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
                />
                <v-switch v-model="localIsClockRunning" label="Run environment clock" inset />
              </div>
              <div class="d-flex flex-wrap ga-4">
                <v-select
                  :items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
                  v-model.number="localSeasonMonthIndex1to12"
                  label="Season month (1..12)"
                  density="comfortable"
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
                />
              </div>
            </div>
          </div>

          <!-- Camera UX -->
          <div>
            <div class="text-subtitle-2 mb-2">Camera</div>
            <v-switch v-model="local.manualTilt" label="Manual tilt (disable auto-tilt)" inset />
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-end ga-2">
          <v-btn variant="text" @click="onCancelOptions">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="onSaveOptions">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Restart confirmation dialog -->
    <v-dialog v-model="showRestartConfirm" max-width="520" persistent>
      <v-card rounded="lg">
        <v-card-title class="text-h6">Restart Required</v-card-title>
        <v-card-text>
          Some changed options require an engine restart to take effect. Reload the game now?
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
