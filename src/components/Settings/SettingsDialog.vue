<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useSettingsDialog } from "@/composables/useSettingsDialog";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  engineSettingPresets,
  type EngineSettings,
  restartRequiredSettingKeys,
} from "@/Player/Human/EngineSettings";
import { WeatherType } from "@/Player/Human/Environment/weather";
import UiSelect from "@/components/Ui/UiSelect.vue";
import UiSlider from "@/components/Ui/UiSlider.vue";
import UiSwitch from "@/components/Ui/UiSwitch.vue";
import router from "@/router";

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
  get: () => Math.round((settings.engineSettings.timeOfDay2400 ?? 0) / 100),
  set: (h: number) => {
    settings.engineSettings.timeOfDay2400 = Math.max(0, Math.min(23, Math.round(h))) * 100;
  },
});

function formattHour(h: number): string {
  const hh = Math.max(0, Math.min(23, Math.round(h)));
  return `${hh.toString().padStart(2, "0")}:00`;
}
</script>

<template>
  <v-dialog v-model="open" max-width="820" scrollable>
    <v-card rounded="lg">
      <v-card-title class="text-h6">Settings</v-card-title>
      <v-card-subtitle v-if="inGame">
        Items marked {{ restartNote }} will restart the engine to take effect.
      </v-card-subtitle>
      <v-divider class="my-2" />
      <v-card-text class="d-flex flex-column ga-5">
        <v-tabs v-model="tab" color="primary" class="mb-4">
          <v-tab value="game">Game</v-tab>
          <v-tab value="graphics">Graphics</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- Game tab -->
          <v-window-item value="game">
            <div class="d-flex flex-column ga-5">
              <!-- Save Management -->
              <div>
                <div class="text-subtitle-2 mb-2">Autosave</div>
                <div class="d-flex flex-column ga-4">
                  <UiSelect
                    v-model="settings.engineSettings.autoSaveFrequency"
                    :items="[
                      { title: 'Every Turn', value: 1 },
                      { title: 'Every 5 Turns', value: 5 },
                      { title: 'Every 10 Turns', value: 10 },
                      { title: 'Disabled', value: 0 },
                    ]"
                    label="Frequency"
                  />
                  <UiSlider
                    v-model="settings.engineSettings.maxAutoSaves"
                    :min="1"
                    :max="20"
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
                      v-model.number="hour24"
                      label="Time of day"
                    />
                    <UiSwitch
                      v-model="settings.engineSettings.isClockRunning"
                      label="Run environment clock"
                    />
                  </div>
                  <div class="d-flex flex-wrap ga-4">
                    <UiSelect
                      :items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
                      v-model.number="settings.engineSettings.month"
                      label="Month (1–12)"
                    />
                    <UiSelect
                      :items="[
                        { title: 'Sunny', value: WeatherType.Sunny },
                        { title: 'Half-Cloud', value: WeatherType.HalfCloud },
                        { title: 'Foggy', value: WeatherType.Foggy },
                        { title: 'Rainy', value: WeatherType.Rainy },
                        { title: 'Thunderstorm', value: WeatherType.Thunderstorm },
                      ]"
                      item-title="title"
                      item-value="value"
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
            <div class="d-flex flex-column ga-5">
              <!-- Preset -->
              <div>
                <div class="text-subtitle-2 mb-2">Preset</div>
                <UiSelect
                  :items="engineSettingPresets"
                  item-title="label"
                  item-value="id"
                  v-model="dialog.localPresetId.value"
                  label="Quality Preset"
                  @update:model-value="(v: string) => dialog.loadPreset(v)"
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
                    :step="0.05"
                    v-model.number="dialog.localGraphicsSettings.renderScale"
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
                    :items="['default', 'high-performance', 'low-power']"
                    v-model="dialog.localGraphicsSettings.powerPreference"
                    :label="labelFor('powerPreference', 'Power preference')"
                  />
                </div>
              </div>

              <!-- Visual effects -->
              <div>
                <div class="text-subtitle-2 mb-2">Visual effects</div>
                <div class="d-flex flex-wrap ga-4">
                  <UiSwitch v-model="dialog.localGraphicsSettings.hdr" label="HDR" />
                  <UiSwitch v-model="dialog.localGraphicsSettings.useFxaa" label="FXAA" />
                  <UiSwitch v-model="dialog.localGraphicsSettings.useBloom" label="Bloom" />
                  <UiSlider
                    class="flex-1-1"
                    :min="0"
                    :max="1"
                    :step="0.1"
                    v-model.number="dialog.localGraphicsSettings.bloomThreshold"
                    label="Bloom threshold"
                  />
                  <UiSlider
                    class="flex-1-1"
                    :min="0"
                    :max="1"
                    :step="0.1"
                    v-model.number="dialog.localGraphicsSettings.bloomWeight"
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
            <v-btn variant="text" @click="dialog.cancelGame(closeDialog)">Cancel</v-btn>
            <v-btn
              :color="dialog.isGameDirty.value ? 'secondary' : undefined"
              :variant="dialog.isGameDirty.value ? 'elevated' : 'tonal'"
              :disabled="!dialog.isGameDirty.value"
              @click="dialog.revertGame"
              >Revert</v-btn
            >
            <v-btn color="primary" variant="flat" @click="closeDialog">Close</v-btn>
          </template>
          <template v-else>
            <v-btn variant="text" @click="dialog.cancelGraphics(closeDialog)">Cancel</v-btn>
            <v-btn
              :color="dialog.isGraphicsDirty.value ? 'secondary' : undefined"
              :variant="dialog.isGraphicsDirty.value ? 'elevated' : 'tonal'"
              :disabled="!dialog.isGraphicsDirty.value"
              @click="dialog.revertGraphics"
              >Revert</v-btn
            >
            <v-btn
              color="primary"
              variant="flat"
              :disabled="!dialog.isGraphicsDirty.value"
              @click="dialog.applyGraphics(closeDialog)"
              >Apply</v-btn
            >
          </template>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Restart confirmation dialog -->
  <v-dialog v-model="dialog.showRestartConfirm.value" max-width="520" persistent>
    <v-card rounded="lg">
      <v-card-title class="text-h6">Restart Required</v-card-title>
      <v-card-text>
        Some changed settings require an engine restart to take effect. Reload the game now?
      </v-card-text>
      <v-card-actions class="justify-end ga-2">
        <v-btn variant="text" @click="dialog.confirmRestartCancel">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="dialog.confirmRestartProceed">Reload</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
