<script setup lang="ts">
import { computed, ref } from "vue";
import { saveManager } from "@/utils/saveManager";
import { useAppStore } from "@/stores/appStore";
import { formatSaveDate } from "@/helpers/timeFormatter";
import TerraConfigDialog from "./Home/TerraConfigDialog.vue";
import SaveBrowserDialog from "./Home/SaveBrowserDialog.vue";
import SettingsDialog from "@/components/Settings/SettingsDialog.vue";

const app = useAppStore();
const latestSave = computed(() => saveManager.getLatest());

const showNewGame = ref(false);
const showLoadGame = ref(false);
const showSettings = ref(false);

async function continueGame() {
  const latest = latestSave.value;
  if (latest) {
    app.router.push({ path: "/game", query: { saveId: latest.id } });
  }
}
</script>

<template>
  <v-main class="fill-height d-flex align-center justify-center bg-grey-darken-4 text-white">
    <div class="text-center pa-6" style="max-width: 600px; width: 100%">
      <v-icon icon="mdi-book-open-variant" size="84" color="light-blue-lighten-2" class="mb-6" />
      <h1 class="text-h2 font-weight-light tracking-tighter mb-12">Pages of History</h1>

      <div class="d-flex flex-column ga-4 align-center">
        <!-- Continue Button -->
        <v-btn
          v-if="latestSave"
          color="light-blue-darken-1"
          size="x-large"
          width="100%"
          height="72"
          prepend-icon="mdi-play-circle-outline"
          @click="continueGame"
        >
          <div class="d-flex flex-column align-start">
            <span class="text-button">Continue</span>
            <span class="text-caption opacity-80">
              {{ latestSave.name }} ({{ formatSaveDate(latestSave.time) }})
            </span>
          </div>
        </v-btn>

        <!-- New Game Button -->
        <v-btn
          color="emerald-darken-1"
          size="x-large"
          width="100%"
          height="64"
          prepend-icon="mdi-plus-circle-outline"
          class="bg-green-darken-2"
          @click="showNewGame = true"
        >
          New Game
        </v-btn>

        <!-- Load Game Button -->
        <v-btn
          color="amber-darken-2"
          size="x-large"
          width="100%"
          height="64"
          prepend-icon="mdi-folder-open-outline"
          @click="showLoadGame = true"
        >
          Load Game
        </v-btn>

        <!-- Settings Button -->
        <v-btn
          variant="outlined"
          size="x-large"
          width="100%"
          height="64"
          prepend-icon="mdi-cog-outline"
          @click="showSettings = true"
        >
          Settings
        </v-btn>
      </div>

      <div class="mt-12 text-caption opacity-50">Alpha Version • Made with Love & History</div>
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
