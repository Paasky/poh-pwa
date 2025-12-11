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

const emit = defineEmits(["quit", "reload"]);
const showQuitConfirm = ref(false);
const showOptions = ref(false);

const app = useAppStore();
const settings = useSettingsStore();

// todo should this be in settingsStore using Pinia-built-in functionality/simple public backup() & reset() api?
// Local editable copy for the dialog
const localPresetId = ref<string>(settings.selectedPresetId);
const local = reactive<EngineOptions>({ ...settings.engine });

// Debug toggles (live, not persisted in EngineOptions)
const localLogicDebugEnabled = ref(false);

watch(
  () => showOptions.value,
  (open) => {
    if (open) {
      // Reset local state when dialog opens
      localPresetId.value = settings.selectedPresetId;
      Object.assign(local, settings.engine);
    }
  },
);

function onPresetChange(id: string) {
  const preset = EngineOptionPresets.find((p) => p.id === id);
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
  // Live-apply safe options
  app.engineService.applyOptions({ ...local });
  settings.selectedPresetId = localPresetId.value;
  Object.assign(settings.engine, { ...local });
  settings.save();
  showOptions.value = false;
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

          <!-- Camera UX -->
          <div>
            <div class="text-subtitle-2 mb-2">Camera</div>
            <v-switch v-model="local.manualTilt" label="Manual tilt (disable auto-tilt)" inset />
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
