<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useSettingsDialog } from "@/Common/composables/useSettingsDialog";
import { useSettingsStore } from "@/App/stores/settingsStore";
import {
  engineSettingPresets,
  type EngineSettings,
  restartRequiredSettingKeys,
} from "@/Actor/Human/EngineSettings";
import { WeatherType } from "@/Actor/Human/Environment/weather";
import { hourFrom2400, hourTo2400 } from "@/Common/Helpers/time";
import UiSelect from "@/App/components/Ui/UiSelect.vue";
import UiSlider from "@/App/components/Ui/UiSlider.vue";
import UiSwitch from "@/App/components/Ui/UiSwitch.vue";
import router from "@/App/router";
import UiButton from "@/App/components/Ui/UiButton.vue";
import UiTabs from "@/App/components/Ui/UiTabs.vue";
import UiDialog from "@/App/components/Ui/UiDialog.vue";
import { IconKey } from "@/Common/Static/Icon";

// Use modern defineModel for v-model binding (no local mirror ref needed)
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ (e: "requestReload"): void }>();

const settings = useSettingsStore();
const dialog = useSettingsDialog(() => emit("requestReload"));

// Local, ephemeral tab state
const tab = ref<"game" | "graphics">("game");
const inGame = computed(() => router.currentRoute.value.name === "game");

// Call lifecycle when dialog opens
watch(
  () => open.value,
  (v) => {
    if (v) dialog.onOpen();
  },
  { immediate: true },
);

const restartNote = "(requires restart)";

function labelFor<K extends keyof EngineSettings>(key: K, base: string): string {
  return restartRequiredSettingKeys.includes(key) && inGame.value ? `${base} ${restartNote}` : base;
}

const isGameTab = computed(() => tab.value === "game");

function closeDialog() {
  open.value = false;
}

// Time-of-day UX: expose an hour slider (0..23), map to/from 0..2400 in store
const hour24 = computed<number>({
  get: () => hourFrom2400(settings.engineSettings.timeOfDay2400 ?? 0),
  set: (h: number) => {
    settings.engineSettings.timeOfDay2400 = hourTo2400(h);
  },
});

const tabItems: { label: string; value: string; icon: IconKey }[] = [
  { label: "Game", value: "game", icon: "world" },
  { label: "Graphics", value: "graphics", icon: "settings" },
];

const autoSaveFrequencyItems = [
  { title: "Every Turn", value: 1 },
  { title: "Every 5 Turns", value: 5 },
  { title: "Every 10 Turns", value: 10 },
  { title: "Disabled", value: 0 },
];

const monthItems = [
  { title: "1", value: 1 },
  { title: "2", value: 2 },
  { title: "3", value: 3 },
  { title: "4", value: 4 },
  { title: "5", value: 5 },
  { title: "6", value: 6 },
  { title: "7", value: 7 },
  { title: "8", value: 8 },
  { title: "9", value: 9 },
  { title: "10", value: 10 },
  { title: "11", value: 11 },
  { title: "12", value: 12 },
];

const weatherItems = [
  { title: "Sunny", value: WeatherType.Sunny },
  { title: "Half-Cloud", value: WeatherType.HalfCloud },
  { title: "Foggy", value: WeatherType.Foggy },
  { title: "Rainy", value: WeatherType.Rainy },
  { title: "Thunderstorm", value: WeatherType.Thunderstorm },
];

const powerPreferenceItems = [
  { title: "Default", value: "default" },
  { title: "High Performance", value: "high-performance" },
  { title: "Low Power", value: "low-power" },
];
</script>

<template>
  <UiDialog v-model="open" title="Settings">
    <template #header-append v-if="inGame">
      <div class="text-caption mr-4 opacity-70">Items marked {{ restartNote }} require restart</div>
    </template>

    <div class="d-flex flex-column ga-5">
      <UiTabs v-model="tab" :items="tabItems" />

      <v-window v-model="tab">
        <!-- Game tab -->
        <v-window-item value="game">
          <div class="d-flex flex-column ga-5 pt-4">
            <!-- Save Management -->
            <div>
              <div class="text-subtitle-2 mb-2">Autosave</div>
              <div class="d-flex flex-column ga-4">
                <UiSelect
                  v-model="settings.engineSettings.autoSaveFrequency"
                  :items="autoSaveFrequencyItems"
                  label="Frequency"
                />
                <UiSlider
                  v-model="settings.engineSettings.maxAutoSaves"
                  :min="1"
                  :max="10"
                  :step="1"
                  label="Max to keep"
                />
              </div>
            </div>

            <!-- Overlays & Layers -->
            <div>
              <div class="text-subtitle-2 mb-2">Overlays & Layers</div>
              <div class="d-flex flex-wrap ga-4">
                <UiSwitch v-model="settings.engineSettings.showGrid" label="Show Grid" />
                <UiSwitch v-model="settings.engineSettings.showClock" label="Show Clock" />
              </div>
            </div>

            <!-- Environment (managed by EnvironmentService) -->
            <div>
              <div class="text-subtitle-2 mb-2">Environment</div>
              <div class="d-flex flex-column ga-4">
                <div class="d-flex flex-wrap ga-4">
                  <UiSlider
                    class="flex-1-1"
                    :min="0"
                    :max="23"
                    :step="1"
                    v-model="hour24"
                    label="Time of day"
                  />
                  <UiSwitch
                    v-model="settings.engineSettings.isClockRunning"
                    label="Run environment clock"
                  />
                </div>
                <div class="d-flex flex-wrap ga-4">
                  <UiSelect
                    :items="monthItems"
                    v-model="settings.engineSettings.month"
                    label="Month (1–12)"
                  />
                  <UiSelect
                    :items="weatherItems"
                    v-model="settings.engineSettings.weatherType"
                    label="Weather"
                  />
                </div>
              </div>
            </div>

            <!-- Camera UX -->
            <div>
              <div class="text-subtitle-2 mb-2">Camera</div>
              <UiSwitch v-model="settings.engineSettings.manualTilt" label="Manual Camera" />
            </div>

            <!-- Debug -->
            <div>
              <div class="text-subtitle-2 mb-2">Debug</div>
              <div class="d-flex ga-4">
                <UiSwitch
                  v-model="settings.engineSettings.enableFogOfWar"
                  label="Enable Fog of War"
                />
                <UiSwitch
                  v-model="settings.engineSettings.enableDebug"
                  label="Logic mesh debug overlay"
                />
              </div>
            </div>
          </div>
        </v-window-item>

        <!-- Graphics tab -->
        <v-window-item value="graphics">
          <div class="d-flex flex-column ga-5 pt-4">
            <!-- Preset -->
            <div>
              <div class="text-subtitle-2 mb-2">Preset</div>
              <UiSelect
                :items="engineSettingPresets"
                item-title="label"
                item-value="id"
                v-model="dialog.localPresetId.value"
                label="Quality Preset"
                @update:model-value="(v: string | undefined) => v && dialog.loadPreset(v)"
              />
            </div>

            <!-- Resolution & Performance -->
            <div>
              <div class="text-subtitle-2 mb-2">Resolution & Performance</div>
              <div class="d-flex flex-wrap ga-4">
                <UiSlider
                  class="flex-1-1"
                  :min="0.5"
                  :max="2"
                  :step="0.25"
                  v-model="dialog.localGraphicsSettings.renderScale"
                  label="Render scale"
                />
                <UiSwitch
                  v-model="dialog.localGraphicsSettings.adaptToDeviceRatio"
                  label="Adapt to device pixel ratio"
                />
              </div>
            </div>

            <!-- PohEngine / GPU Context (restart) -->
            <div>
              <div class="text-subtitle-2 mb-2">GPU Context</div>
              <div class="d-flex flex-wrap ga-4">
                <UiSwitch
                  v-model="dialog.localGraphicsSettings.antialias"
                  :label="labelFor('antialias', 'Antialias')"
                />
                <UiSwitch
                  v-model="dialog.localGraphicsSettings.preserveDrawingBuffer"
                  :label="labelFor('preserveDrawingBuffer', 'Preserve drawing buffer')"
                />
                <UiSwitch
                  v-model="dialog.localGraphicsSettings.stencil"
                  :label="labelFor('stencil', 'Stencil buffer')"
                />
                <UiSwitch
                  v-model="dialog.localGraphicsSettings.disableWebGL2Support"
                  :label="labelFor('disableWebGL2Support', 'Disable WebGL2')"
                />
                <UiSelect
                  :items="powerPreferenceItems"
                  v-model="dialog.localGraphicsSettings.powerPreference"
                  :label="labelFor('powerPreference', 'Power preference')"
                />
              </div>
            </div>

            <!-- Visual effects -->
            <div>
              <div class="text-subtitle-2 mb-2">Visual effects</div>
              <div class="d-flex flex-wrap ga-4 mb-4">
                <UiSwitch v-model="dialog.localGraphicsSettings.hdr" label="HDR" />
                <UiSwitch v-model="dialog.localGraphicsSettings.useFxaa" label="FXAA" />
                <UiSwitch v-model="dialog.localGraphicsSettings.useBloom" label="Bloom" />
                <UiSlider
                  class="flex-1-1"
                  :min="0"
                  :max="1"
                  :step="0.1"
                  v-model="dialog.localGraphicsSettings.bloomThreshold"
                  label="Bloom threshold"
                />
                <UiSlider
                  class="flex-1-1"
                  :min="0"
                  :max="1"
                  :step="0.1"
                  v-model="dialog.localGraphicsSettings.bloomWeight"
                  label="Bloom weight"
                />
              </div>
            </div>
          </div>
        </v-window-item>
      </v-window>
    </div>

    <template #actions>
      <div class="d-flex align-center justify-space-between w-100 ga-4 flex-wrap">
        <div class="text-caption text-medium-emphasis">
          <template v-if="!isGameTab">
            <span v-if="dialog.isGraphicsDirty.value">You have unapplied changes</span>
            <span v-else>No pending changes</span>
          </template>
          <template v-else>
            <span v-if="dialog.isGameDirty">Changes take effect immediately</span>
            <span v-else>No changes</span>
          </template>
        </div>
        <div class="d-flex ga-2">
          <template v-if="isGameTab">
            <UiButton
              type="text"
              @click="dialog.cancelGame(closeDialog)"
              text="Cancel"
              size="default"
            />
            <UiButton
              type="secondary"
              :is-disabled="!dialog.isGameDirty.value"
              @click="dialog.revertGame"
              text="Revert"
              size="default"
            />
            <UiButton
              type="primary"
              :is-disabled="!dialog.isGameDirty.value"
              text="Save"
              size="default"
            />
          </template>
          <template v-else>
            <UiButton
              type="text"
              @click="dialog.cancelGraphics(closeDialog)"
              text="Cancel"
              size="default"
            />
            <UiButton
              type="secondary"
              :is-disabled="!dialog.isGraphicsDirty.value"
              @click="dialog.revertGraphics"
              text="Revert"
              size="default"
            />
            <UiButton
              type="primary"
              :is-disabled="!dialog.isGraphicsDirty.value"
              @click="dialog.applyGraphics(closeDialog)"
              text="Apply"
              size="default"
            />
          </template>
        </div>
      </div>
    </template>
  </UiDialog>

  <!-- Restart confirmation dialog -->
  <UiDialog
    v-model="dialog.showRestartConfirm.value"
    title="Restart Required"
    :max-width="520"
    persistent
  >
    Some changed settings require an engine restart to take effect. Reload the game now?
    <template #actions>
      <UiButton type="text" @click="dialog.confirmRestartCancel" text="Cancel" size="large" />
      <UiButton type="primary" @click="dialog.confirmRestartProceed" text="Reload" size="large" />
    </template>
  </UiDialog>
</template>

<style scoped></style>
