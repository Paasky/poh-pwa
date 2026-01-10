<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useEncyclopediaStore } from "@/App/components/Encyclopedia/encyclopediaStore";
import { toggleFullscreen } from "@/Common/Helpers/fullscreen";
import UiButton from "@/App/components/Ui/UiButton.vue";
import SettingsDialog from "@/App/components/Settings/SettingsDialog.vue";
import SaveDialog from "@/App/components/Saves/SaveDialog.vue";
import { useSettingsStore } from "@/App/stores/settingsStore";
import { SaveAction } from "@/Actor/Human/Actions/SaveAction";
import { getHotkeyLabel } from "@/Actor/Human/HotkeyManager";

defineEmits(["quit", "reload"]);
const showQuitConfirm = ref(false);
const showSettings = ref(false);
const showSaveModal = ref(false);

const settings = useSettingsStore();

const time = ref("");
let timer: ReturnType<typeof setInterval> | null = null;

function updateTime() {
  time.value = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="d-flex ga-2">
    <div
      v-if="settings.engineSettings.showClock"
      class="rounded-b-lg elevation-4 d-flex align-center px-3 bg-background"
      style="height: 1.5rem; min-width: 3rem; justify-content: center; user-select: none"
    >
      {{ time }}
    </div>
    <UiButton
      icon="question"
      type="secondary"
      rounded="b-lg"
      tooltip="Encyclopedia"
      @click="useEncyclopediaStore().open()"
    />
    <UiButton
      icon="fullscreenAlt"
      type="secondary"
      rounded="b-lg"
      tooltip="Toggle Fullscreen"
      @click="toggleFullscreen()"
    />
    <UiButton id="menu-btn" icon="menu" type="secondary" rounded="b-lg" tooltip="Menu" />
    <v-menu activator="#menu-btn" transition="slide-y-transition">
      <v-list density="comfortable">
        <v-list-item
          value="quick-save"
          title="Quick Save"
          :subtitle="getHotkeyLabel('S', ['ctrl'])"
          @click="SaveAction.quickSave()"
        />
        <v-list-item value="save" title="Save / Load Game" @click="showSaveModal = true" />
        <v-divider class="my-1" />
        <v-list-item value="settings" title="Settings" @click="showSettings = true" />
        <v-divider class="my-1" />
        <v-list-item value="quit" title="Quit" @click="showQuitConfirm = true" />
      </v-list>
    </v-menu>

    <!-- Modals -->
    <SaveDialog v-model="showSaveModal" />

    <!-- Settings dialog -->
    <SettingsDialog v-model="showSettings" @request-reload="$emit('reload')" />

    <!-- Quit confirmation dialog -->
    <v-dialog v-model="showQuitConfirm" max-width="378" persistent>
      <v-card rounded="lg">
        <v-card-title class="text-h6">Confirm Quit</v-card-title>
        <v-card-text>
          Are you sure you want to Quit?<br />
          Unsaved progress may be lost.
        </v-card-text>
        <v-card-actions class="justify-end ga-2">
          <UiButton type="text" @click="showQuitConfirm = false" text="Cancel" />
          <UiButton type="danger" @click="$emit('quit')" text="Quit" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped></style>
