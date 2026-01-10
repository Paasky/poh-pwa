<script setup lang="ts">
import { computed } from "vue";
import {
  playerDetailConfig,
  type TabId,
  usePlayerDetailsStore,
} from "@/App/components/PlayerDetails/playerDetailsStore";
import EconomyTab from "@/App/components/PlayerDetails/Tabs/EconomyTab.vue";
import ResearchTab from "@/App/components/PlayerDetails/Tabs/ResearchTab.vue";
import CultureTab from "@/App/components/PlayerDetails/Tabs/CultureTab.vue";
import ReligionTab from "@/App/components/PlayerDetails/Tabs/ReligionTab.vue";
import DiplomacyTab from "@/App/components/PlayerDetails/Tabs/DiplomacyTab.vue";
import TradeTab from "@/App/components/PlayerDetails/Tabs/TradeTab.vue";
import UnitsTab from "@/App/components/PlayerDetails/Tabs/UnitsTab.vue";
import CitiesTab from "@/App/components/PlayerDetails/Tabs/CitiesTab.vue";
import GovernmentTab from "@/App/components/PlayerDetails/Tabs/GovernmentTab.vue";
import UiDialog from "@/App/components/Ui/UiDialog.vue";
import UiTabs from "@/App/components/Ui/UiTabs.vue";

const store = usePlayerDetailsStore();

// Map undefined in store to null for Vuetify v-model, and back on set
const tabModel = computed<TabId | null>({
  get: () => (store.tab === undefined ? null : store.tab),
  set: (v: TabId | null) => store.open(v ?? undefined),
});
</script>

<template>
  <UiDialog
    :model-value="store.isOpen"
    @update:model-value="(val) => !val && store.close()"
    title="Player Details"
    fullscreen
    :close-on-back="false"
  >
    <div class="d-flex flex-column h-100 ga-4">
      <UiTabs
        v-model="tabModel"
        :items="
          playerDetailConfig.map((t) => ({
            label: t.label,
            value: t.id,
            icon: t.icon,
          }))
        "
      />

      <div class="flex-grow-1 overflow-hidden">
        <v-window v-model="tabModel" class="h-100">
          <v-window-item value="economy" class="h-100 overflow-y-auto"
            ><EconomyTab
          /></v-window-item>
          <v-window-item value="research" class="h-100 overflow-y-auto"
            ><ResearchTab
          /></v-window-item>
          <v-window-item value="culture" class="h-100 overflow-y-auto"
            ><CultureTab
          /></v-window-item>
          <v-window-item value="religion" class="h-100 overflow-y-auto"
            ><ReligionTab
          /></v-window-item>
          <v-window-item value="diplomacy" class="h-100 overflow-y-auto"
            ><DiplomacyTab
          /></v-window-item>
          <v-window-item value="trade" class="h-100 overflow-y-auto"><TradeTab /></v-window-item>
          <v-window-item value="units" class="h-100 overflow-y-auto"><UnitsTab /></v-window-item>
          <v-window-item value="cities" class="h-100 overflow-y-auto"><CitiesTab /></v-window-item>
          <v-window-item value="government" class="h-100 overflow-y-auto"
            ><GovernmentTab
          /></v-window-item>
        </v-window>
      </div>
    </div>
  </UiDialog>
</template>
