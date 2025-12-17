<script setup lang="ts">
import { computed, watch } from "vue";
import { useSettingsDialog } from "@/composables/useSettingsDialog";
import { EngineOptionPresets } from "@/components/Engine/EngineService";
import { WeatherType } from "@/components/Engine/environments/weather";

// Use modern defineModel for v-model binding (no local mirror ref needed)
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ (e: "requestReload"): void }>();

const dialog = useSettingsDialog({ onRequestReload: () => emit("requestReload") });

// Call lifecycle when dialog opens/closes
watch(
  () => open.value,
  (v) => {
    if (v) dialog.onOpen();
    else dialog.onClose();
  },
  { immediate: true },
);

const restartNote = "(requires restart)";

const isGameTab = computed(() => dialog.tab.value === "game");

function closeDialog() {
  open.value = false;
}

// Time-of-day UX: expose an hour slider (0..23), map to/from 0..2400 in store
const hour24 = computed<number>({
  get: () => Math.round((dialog.timeOfDay2400.value ?? 0) / 100),
  set: (h: number) => dialog.setTimeOfDayPersist(Math.max(0, Math.min(23, Math.round(h))) * 100),
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
        <v-tabs v-model="dialog.tab.value" color="primary" class="mb-4">
          <v-tab value="game">Game</v-tab>
          <v-tab value="graphics">Graphics</v-tab>
        </v-tabs>

        <v-window v-model="dialog.tab.value">
          <!-- Game tab -->
          <v-window-item value="game">
            <div class="d-flex flex-column ga-5">
              <!-- Overlays & Layers -->
              <div>
                <div class="text-subtitle-2 mb-2">Overlays & Layers</div>
                <div class="d-flex flex-wrap ga-4">
                  <v-switch
                    v-model="dialog.localEngine.showGrid"
                    label="Show Grid"
                    inset
                    @update:model-value="dialog.setShowGrid"
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
                      v-model="dialog.isClockRunning.value"
                      label="Run environment clock"
                      inset
                      @update:model-value="dialog.setClockRunningPersist"
                    />
                  </div>
                  <div class="d-flex flex-wrap ga-4">
                    <v-select
                      :items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
                      v-model.number="dialog.month.value"
                      label="Month (1–12)"
                      density="comfortable"
                      @update:model-value="dialog.setMonthPersist"
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
                      v-model="dialog.weatherType.value"
                      label="Weather"
                      density="comfortable"
                      @update:model-value="dialog.setWeatherPersist"
                    />
                  </div>
                </div>
              </div>

              <!-- Camera UX -->
              <div>
                <div class="text-subtitle-2 mb-2">Camera</div>
                <v-switch
                  v-model="dialog.localEngine.manualTilt"
                  label="Manual Camera"
                  inset
                  @update:model-value="dialog.setManualTilt"
                />
              </div>

              <!-- Debug -->
              <div>
                <div class="text-subtitle-2 mb-2">Debug</div>
                <v-switch
                  v-model="dialog.logicDebug.value"
                  label="Logic mesh debug overlay"
                  inset
                  @update:model-value="dialog.setLogicDebug"
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
                  v-model="dialog.localPresetId.value"
                  label="Quality Preset"
                  density="comfortable"
                  @update:model-value="
                    (id: string) => {
                      const p = EngineOptionPresets.find((x) => x.id === id);
                      if (p) Object.assign(dialog.localEngine, p.value);
                    }
                  "
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
                    v-model.number="dialog.localEngine.renderScale"
                    label="Render scale"
                    hint="Scales internal render resolution. Lower = faster (0.5), higher = crisper (1.25). Impact: medium"
                    persistent-hint
                  />
                  <v-switch
                    v-model="dialog.localEngine.adaptToDeviceRatio"
                    :label="`Adapt to device pixel ratio ${restartNote}`"
                    hint="Use devicePixelRatio for base resolution. Improves clarity on HiDPI; can be heavier on GPU. Impact: medium"
                    persistent-hint
                    inset
                  />
                </div>
              </div>

              <!-- Engine / GPU Context (restart) -->
              <div>
                <div class="text-subtitle-2 mb-2">GPU Context</div>
                <div class="d-flex flex-wrap ga-4">
                  <v-switch
                    v-model="dialog.localEngine.antialias"
                    :label="`Antialias ${restartNote}`"
                    hint="Enable multi-sample antialiasing at context level. Smoother edges. Impact: low–medium"
                    persistent-hint
                    inset
                  />
                  <v-switch
                    v-model="dialog.localEngine.preserveDrawingBuffer"
                    :label="`Preserve drawing buffer ${restartNote}`"
                    hint="Keeps previous frame buffer. Needed for screenshots on some platforms; increases memory. Impact: low"
                    persistent-hint
                    inset
                  />
                  <v-switch
                    v-model="dialog.localEngine.stencil"
                    :label="`Stencil buffer ${restartNote}`"
                    hint="Enable stencil buffer support. Required for some effects. Impact: low"
                    persistent-hint
                    inset
                  />
                  <v-switch
                    v-model="dialog.localEngine.disableWebGL2Support"
                    :label="`Disable WebGL2 ${restartNote}`"
                    hint="Force WebGL1 for compatibility. Generally slower and less featureful."
                    persistent-hint
                    inset
                  />
                  <v-select
                    :items="['default', 'high-performance', 'low-power']"
                    v-model="dialog.localEngine.powerPreference"
                    :label="`Power preference ${restartNote}`"
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
                    v-model="dialog.localEngine.hdr"
                    label="HDR"
                    hint="High dynamic range rendering for brighter brights and deeper darks (when supported). Impact: medium"
                    persistent-hint
                    inset
                  />
                  <v-switch
                    v-model="dialog.localEngine.useFxaa"
                    label="FXAA"
                    hint="Fast Approximate Anti-Aliasing. Smooths jagged edges at low cost. Impact: low"
                    persistent-hint
                    inset
                  />
                  <v-switch
                    v-model="dialog.localEngine.useBloom"
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
                    :disabled="!dialog.localEngine.useBloom"
                    v-model.number="dialog.localEngine.bloomThreshold"
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
                    :disabled="!dialog.localEngine.useBloom"
                    v-model.number="dialog.localEngine.bloomWeight"
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
            <span v-if="dialog.isGameDirty.value">Changes take effect immediately</span>
            <span v-else>No changes</span>
          </template>
        </div>
        <div class="d-flex ga-2">
          <template v-if="isGameTab">
            <v-btn variant="text" @click="dialog.cancelGame(closeDialog)">Cancel</v-btn>
            <v-btn variant="text" :disabled="!dialog.isGameDirty.value" @click="dialog.revertGame"
              >Revert</v-btn
            >
            <v-btn color="primary" variant="flat" @click="closeDialog">Close</v-btn>
          </template>
          <template v-else>
            <v-btn variant="text" @click="dialog.cancelGraphics(closeDialog)">Cancel</v-btn>
            <v-btn
              variant="tonal"
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
