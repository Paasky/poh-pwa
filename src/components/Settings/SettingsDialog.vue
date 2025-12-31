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

// Use modern defineModel for v-model binding (no local mirror ref needed)
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ (e: "requestReload"): void }>();

const settings = useSettingsStore();
const dialog = useSettingsDialog(() => emit("requestReload"));

// Local, ephemeral tab state
const tab = ref<"game" | "graphics">("game");

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
  return restartRequiredSettingKeys.includes(key) ? `${base} ${restartNote}` : base;
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

function fmtHour(h: number): string {
  const hh = Math.max(0, Math.min(23, Math.round(h)));
  return `${hh.toString().padStart(2, "0")}:00`;
}
</script>

<template>
  <v-dialog v-model="open" max-width="820" scrollable>
    <v-card rounded="lg">
      <v-card-title class="text-h6">Settings</v-card-title>
      <v-card-subtitle>
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
                  <v-select
                    v-model="settings.engineSettings.autoSaveFrequency"
                    :items="[
                      { title: 'Every Turn', value: 1 },
                      { title: 'Every 5 Turns', value: 5 },
                      { title: 'Every 10 Turns', value: 10 },
                      { title: 'Disabled', value: 0 },
                    ]"
                    label="Frequency"
                    density="comfortable"
                  />
                  <v-slider
                    v-model="settings.engineSettings.maxAutoSaves"
                    min="1"
                    max="50"
                    step="1"
                    thumb-label
                    label="Max to keep"
                  />
                </div>
              </div>

              <!-- Overlays & Layers -->
              <div>
                <div class="text-subtitle-2 mb-2">Overlays & Layers</div>
                <div class="d-flex flex-wrap ga-4">
                  <v-switch v-model="settings.engineSettings.showGrid" label="Show Grid" inset />
                  <v-switch v-model="settings.engineSettings.showClock" label="Show Clock" inset />
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
                      max="23"
                      step="1"
                      thumb-label
                      v-model.number="hour24"
                      label="Time of day"
                      hint="Time of day (0:00–23:00)."
                      persistent-hint
                    >
                      <template #thumb-label="{ modelValue }">
                        {{ fmtHour(modelValue) }}
                      </template>
                    </v-slider>
                    <v-switch
                      v-model="settings.engineSettings.isClockRunning"
                      label="Run environment clock"
                      inset
                    />
                  </div>
                  <div class="d-flex flex-wrap ga-4">
                    <v-select
                      :items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
                      v-model.number="settings.engineSettings.month"
                      label="Month (1–12)"
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
                      v-model="settings.engineSettings.weatherType"
                      label="Weather"
                      density="comfortable"
                    />
                  </div>
                </div>
              </div>

              <!-- Camera UX -->
              <div>
                <div class="text-subtitle-2 mb-2">Camera</div>
                <v-switch
                  v-model="settings.engineSettings.manualTilt"
                  label="Manual Camera"
                  inset
                />
              </div>

              <!-- Debug -->
              <div>
                <div class="text-subtitle-2 mb-2">Debug</div>
                <div class="d-flex ga-4">
                  <v-switch
                    v-model="settings.engineSettings.enableFogOfWar"
                    label="Enable Fog of War"
                    inset
                  />
                  <v-switch
                    v-model="settings.engineSettings.enableDebug"
                    label="Logic mesh debug overlay"
                    inset
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
                <v-select
                  :items="engineSettingPresets"
                  item-title="label"
                  item-value="id"
                  v-model="dialog.localPresetId.value"
                  label="Quality Preset"
                  density="comfortable"
                  @update:model-value="(v) => dialog.loadPreset(v)"
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
                    v-model.number="dialog.localGraphicsSettings.renderScale"
                    label="Render scale"
                    hint="Scales internal render resolution. Lower = faster (0.5), higher = crisper (1.25). Impact: medium"
                    persistent-hint
                  />
                  <v-switch
                    v-model="dialog.localGraphicsSettings.adaptToDeviceRatio"
                    label="Adapt to device pixel ratio"
                    hint="Use devicePixelRatio for base resolution. Improves clarity on HiDPI; can be heavier on GPU. Impact: medium"
                    persistent-hint
                    inset
                  />
                </div>
              </div>

              <!-- PohEngine / GPU Context (restart) -->
              <div>
                <div class="text-subtitle-2 mb-2">GPU Context</div>
                <div class="d-flex flex-wrap ga-4">
                  <v-switch
                    v-model="dialog.localGraphicsSettings.antialias"
                    :label="labelFor('antialias', 'Antialias')"
                    hint="Enable multi-sample antialiasing at context level. Smoother edges. Impact: low–medium"
                    persistent-hint
                    inset
                  />
                  <v-switch
                    v-model="dialog.localGraphicsSettings.preserveDrawingBuffer"
                    :label="labelFor('preserveDrawingBuffer', 'Preserve drawing buffer')"
                    hint="Keeps previous frame buffer. Needed for screenshots on some platforms; increases memory. Impact: low"
                    persistent-hint
                    inset
                  />
                  <v-switch
                    v-model="dialog.localGraphicsSettings.stencil"
                    :label="labelFor('stencil', 'Stencil buffer')"
                    hint="Enable stencil buffer support. Required for some effects. Impact: low"
                    persistent-hint
                    inset
                  />
                  <v-switch
                    v-model="dialog.localGraphicsSettings.disableWebGL2Support"
                    :label="labelFor('disableWebGL2Support', 'Disable WebGL2')"
                    hint="Force WebGL1 for compatibility. Generally slower and less featureful."
                    persistent-hint
                    inset
                  />
                  <v-select
                    :items="['default', 'high-performance', 'low-power']"
                    v-model="dialog.localGraphicsSettings.powerPreference"
                    :label="labelFor('powerPreference', 'Power preference')"
                    hint="Request GPU power profile from browser/OS. Might be ignored depending on platform."
                    persistent-hint
                    density="comfortable"
                  />
                </div>
              </div>

              <!-- Visual effects -->
              <div>
                <div class="text-subtitle-2 mb-2">Visual effects</div>
                <div class="d-flex flex-wrap ga-4">
                  <v-switch
                    v-model="dialog.localGraphicsSettings.hdr"
                    label="HDR"
                    hint="High dynamic range rendering for brighter brights and deeper darks (when supported). Impact: medium"
                    persistent-hint
                    inset
                  />
                  <v-switch
                    v-model="dialog.localGraphicsSettings.useFxaa"
                    label="FXAA"
                    hint="Fast Approximate Anti-Aliasing. Smooths jagged edges at low cost. Impact: low"
                    persistent-hint
                    inset
                  />
                  <v-switch
                    v-model="dialog.localGraphicsSettings.useBloom"
                    label="Bloom"
                    hint="Glowing halo around bright areas. Tune threshold/weight below. Impact: medium–high"
                    persistent-hint
                    inset
                  />
                  <v-slider
                    class="flex-1-1"
                    min="0"
                    max="1"
                    step="0.01"
                    thumb-label
                    :disabled="!dialog.localGraphicsSettings.useBloom"
                    v-model.number="dialog.localGraphicsSettings.bloomThreshold"
                    label="Bloom threshold"
                    hint="How bright a pixel must be to start glowing. Lower = more areas bloom. Impact: low"
                    persistent-hint
                  />
                  <v-slider
                    class="flex-1-1"
                    min="0"
                    max="1"
                    step="0.01"
                    thumb-label
                    :disabled="!dialog.localGraphicsSettings.useBloom"
                    v-model.number="dialog.localGraphicsSettings.bloomWeight"
                    label="Bloom weight"
                    hint="Strength of the bloom effect. Higher = stronger glow. Impact: low"
                    persistent-hint
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
              variant="text"
              :color="dialog.isGameDirty.value ? 'secondary' : undefined"
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
