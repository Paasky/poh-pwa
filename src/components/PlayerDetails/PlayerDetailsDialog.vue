<script setup lang="ts">
import { computed } from "vue";
import {
  playerDetailConfig,
  type TabId,
  usePlayerDetailsStore,
} from "@/components/PlayerDetails/playerDetailsStore";
import EconomyTab from "@/components/PlayerDetails/Tabs/EconomyTab.vue";
import ResearchTab from "@/components/PlayerDetails/Tabs/ResearchTab.vue";
import CultureTab from "@/components/PlayerDetails/Tabs/CultureTab.vue";
import ReligionTab from "@/components/PlayerDetails/Tabs/ReligionTab.vue";
import DiplomacyTab from "@/components/PlayerDetails/Tabs/DiplomacyTab.vue";
import TradeTab from "@/components/PlayerDetails/Tabs/TradeTab.vue";
import UnitsTab from "@/components/PlayerDetails/Tabs/UnitsTab.vue";
import CitiesTab from "@/components/PlayerDetails/Tabs/CitiesTab.vue";
import GovernmentTab from "@/components/PlayerDetails/Tabs/GovernmentTab.vue";

const store = usePlayerDetailsStore();

// Map undefined in store to null for Vuetify v-model, and back on set
const tabModel = computed<TabId | null>({
  get: () => (store.tab === undefined ? null : store.tab),
  set: (v: TabId | null) => store.open(v ?? undefined),
});
</script>

<template>
  <v-dialog v-model="store.isOpen" fullscreen :scrim="true" :close-on-back="false">
    <v-card color="surface" class="d-flex flex-column h-100">
      <!-- Top bar: Tabs fill available space + Close button on the right -->
      <v-toolbar density="comfortable" color="secondary" class="px-2" style="user-select: none">
        <!-- Growing tabs -->
        <div class="flex-grow-1 overflow-hidden">
          <v-tabs v-model="tabModel" grow height="48" class="flex-grow-1" color="primary">
            <v-tab v-for="t in playerDetailConfig" :key="t.id" :value="t.id">
              <template #prepend>
                <v-icon :icon="t.iconClass" :color="t.iconColor" />
              </template>
              {{ t.label }}
            </v-tab>
          </v-tabs>
        </div>
        <v-btn
          icon
          variant="text"
          class="flex-shrink-0 ml-2"
          :title="'Close'"
          @click="store.close()"
        >
          <v-icon icon="fa-xmark" />
        </v-btn>
      </v-toolbar>

      <!-- Content -->
      <v-card-text class="pa-0 flex-grow-1 d-flex flex-column overflow-hidden">
        <v-window v-model="tabModel" class="flex-grow-1 w-100 h-100 overflow-hidden">
          <v-window-item value="economy" class="w-100 h-100 overflow-x-hidden overflow-y-auto"
            ><EconomyTab />
          </v-window-item>
          <v-window-item value="research" class="w-100 h-100 overflow-auto"
            ><ResearchTab />
          </v-window-item>
          <v-window-item value="culture" class="w-100 h-100 overflow-x-hidden overflow-y-auto"
            ><CultureTab />
          </v-window-item>
          <v-window-item value="religion" class="w-100 h-100 overflow-x-hidden overflow-y-auto"
            ><ReligionTab />
          </v-window-item>
          <v-window-item value="diplomacy" class="w-100 h-100 overflow-x-hidden overflow-y-auto"
            ><DiplomacyTab />
          </v-window-item>
          <v-window-item value="trade" class="w-100 h-100 overflow-x-hidden overflow-y-auto"
            ><TradeTab />
          </v-window-item>
          <v-window-item value="units" class="w-100 h-100 overflow-x-hidden overflow-y-auto"
            ><UnitsTab />
          </v-window-item>
          <v-window-item value="cities" class="w-100 h-100 overflow-x-hidden overflow-y-auto"
            ><CitiesTab />
          </v-window-item>
          <v-window-item value="government" class="w-100 h-100 overflow-x-hidden overflow-y-auto"
            ><GovernmentTab />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
