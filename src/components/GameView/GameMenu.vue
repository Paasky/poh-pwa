<script setup lang="ts">
import { ref } from "vue";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";
import { toggleFullscreen } from "@/helpers/fullscreen";
import UiButton from "@/components/Ui/UiButton.vue";
import SettingsDialog from "@/components/Settings/SettingsDialog.vue";

defineEmits(["quit", "reload"]);
const showQuitConfirm = ref(false);
const showSettings = ref(false);
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
