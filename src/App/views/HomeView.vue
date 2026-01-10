<script setup lang="ts">
import { computed, ref } from "vue";
import { saveManager } from "@/Common/utils/saveManager";
import { formatSaveDate } from "@/Common/Helpers/timeFormatter";
import TerraConfigDialog from "./Home/TerraConfigDialog.vue";
import SaveDialog from "@/App/components/Saves/SaveDialog.vue";
import SettingsDialog from "@/App/components/Settings/SettingsDialog.vue";
import UiButton from "@/App/components/Ui/UiButton.vue";
import UiIcon from "@/App/components/Ui/UiIcon.vue";
import router from "@/App/router";
import { hasDataBucket } from "@/Data/useDataBucket";
import { DataBucket } from "@/Data/DataBucket";
import { useEncyclopediaStore } from "@/App/components/Encyclopedia/encyclopediaStore";
import EncyclopediaDialog from "@/App/components/Encyclopedia/EncyclopediaDialog.vue";
import { useAppStore } from "@/App/stores/appStore";

if (!hasDataBucket()) await DataBucket.init();
useEncyclopediaStore().init();
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

useAppStore().syncUiStateFromNav();
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
          type="secondary"
          is-block
          size="x-large"
          width="100%"
          height="72"
          icon="play"
          @click="continueGame"
          text="Continue"
          effect-is-under
          :effectText="`${latestSave.name} (${formatSaveDate(latestSave.time)})`"
        />

        <!-- New Game Button -->
        <UiButton
          type="secondary"
          is-block
          size="x-large"
          width="100%"
          height="64"
          icon="plus"
          @click="showNewGame = true"
          text="New Game"
        />

        <!-- Load Game Button -->
        <UiButton
          type="secondary"
          is-block
          size="x-large"
          width="100%"
          height="64"
          icon="folderOpen"
          @click="showLoadGame = true"
          text="Load Game"
        />

        <!-- Settings Button -->
        <UiButton
          type="utility"
          is-block
          size="x-large"
          width="100%"
          height="64"
          icon="cog"
          @click="showSettings = true"
          text="Settings"
        />

        <!-- Encyclopedia Button -->
        <UiButton
          type="utility"
          is-block
          size="x-large"
          width="100%"
          height="64"
          icon="question"
          @click="useEncyclopediaStore().open()"
          text="Encyclopedia"
        />
      </div>

      <div class="mt-12 text-caption opacity-50">Alpha Version • Made for the Love of History</div>
    </div>

    <!-- Dialogs -->
    <EncyclopediaDialog />
    <SaveDialog v-model="showLoadGame" />
    <SettingsDialog v-model="showSettings" />
    <TerraConfigDialog v-model="showNewGame" />
  </v-main>
</template>

<style scoped>
.tracking-tighter {
  letter-spacing: -0.05em !important;
}
</style>
