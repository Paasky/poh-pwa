<script setup lang="ts">
import { computed, ref } from "vue";
import { saveManager } from "@/utils/saveManager";
import { formatSaveDate } from "@/helpers/timeFormatter";
import TerraConfigDialog from "./Home/TerraConfigDialog.vue";
import SaveBrowserDialog from "./Home/SaveBrowserDialog.vue";
import SettingsDialog from "@/components/Settings/SettingsDialog.vue";
import UiButton from "@/components/Ui/UiButton.vue";
import UiIcon from "@/components/Ui/UiIcon.vue";
import { useSettingsStore } from "@/stores/settingsStore";
import router from "@/router";

useSettingsStore().init();
const latestSave = computed(() => saveManager.getLatest());

const showNewGame = ref(false);
const showLoadGame = ref(false);
const showSettings = ref(false);

async function continueGame() {
  const latest = latestSave.value;
  if (latest) {
    router.push({ path: "/game", query: { saveId: latest.id } });
  }
}
</script>

<template>
  <v-main class="fill-height d-flex align-center justify-center bg-grey-darken-4 text-white">
    <div class="text-center pa-6" style="max-width: 600px; width: 100%">
      <UiIcon icon="bookOpen" size="lg" class="mb-6" />
      <h1 class="text-h2 font-weight-light tracking-tighter mb-12">Pages of History</h1>

      <div class="d-flex flex-column ga-4 align-center">
        <!-- Continue Button -->
        <UiButton
          v-if="latestSave"
          color="secondary"
          size="x-large"
          width="100%"
          height="72"
          icon="play"
          @click="continueGame"
          text="Continue"
          :effectText="`${latestSave.name} (${formatSaveDate(latestSave.time)})`"
        />

        <!-- New Game Button -->
        <UiButton
          color="secondary"
          size="x-large"
          width="100%"
          height="64"
          icon="plus"
          @click="showNewGame = true"
          text="New Game"
        />

        <!-- Load Game Button -->
        <UiButton
          color="secondary"
          size="x-large"
          width="100%"
          height="64"
          icon="folderOpen"
          @click="showLoadGame = true"
          text="Load Game"
        />

        <!-- Settings Button -->
        <UiButton
          color="surface"
          variant="flat"
          size="x-large"
          width="100%"
          height="64"
          icon="cog"
          @click="showSettings = true"
          text="Settings"
        />
      </div>

      <div class="mt-12 text-caption opacity-50">Alpha Version • Made for the Love of History</div>
    </div>

    <!-- Dialogs -->
    <TerraConfigDialog v-model="showNewGame" />
    <SaveBrowserDialog v-model="showLoadGame" />
    <SettingsDialog v-model="showSettings" />
  </v-main>
</template>

<style scoped>
.tracking-tighter {
  letter-spacing: -0.05em !important;
}
</style>
