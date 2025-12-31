<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";
import { toggleFullscreen } from "@/helpers/fullscreen";
import UiButton from "@/components/Ui/UiButton.vue";
import SettingsDialog from "@/components/Settings/SettingsDialog.vue";
import { useSettingsStore } from "@/stores/settingsStore";

defineEmits(["quit", "reload"]);
const showQuitConfirm = ref(false);
const showSettings = ref(false);

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
      color="secondary"
      rounded="0"
      class="rounded-b-lg"
      tooltip="Encyclopedia"
      @click="useEncyclopediaStore().open()"
    />
    <UiButton
      icon="fullscreenAlt"
      color="secondary"
      rounded="0"
      class="rounded-b-lg"
      tooltip="Toggle Fullscreen"
      @click="toggleFullscreen()"
    />
    <UiButton
      id="menu-btn"
      icon="menu"
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
          <v-btn variant="text" @click="showQuitConfirm = false">Cancel</v-btn>
          <v-btn color="red" variant="flat" @click="$emit('quit')">Quit</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped></style>
