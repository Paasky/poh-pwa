<script setup lang="ts">
import { computed } from "vue";
import {
  tabsConfig,
  usePlayerDetailsStore,
} from "@/components/PlayerDetails/playerDetailsStore";
import UiIcon from "@/components/Ui/UiIcon.vue";
import { useObjectsStore } from "@/stores/objectStore";
import UiModal from "@/components/Ui/UiModal.vue";
import EconomyTab from "@/components/PlayerDetails/EconomyTab/EconomyTab.vue";
import ResearchTab from "@/components/PlayerDetails/ResearchTab/ResearchTab.vue";
import CultureTab from "@/components/PlayerDetails/CultureTab/CultureTab.vue";
import ReligionTab from "@/components/PlayerDetails/ReligionTab/ReligionTab.vue";
import DiplomacyTab from "@/components/PlayerDetails/DiplomacyTab/DiplomacyTab.vue";
import CitiesTab from "@/components/PlayerDetails/CitiesTab/CitiesTab.vue";
import UnitsTab from "@/components/PlayerDetails/UnitsTab/UnitsTab.vue";
import TradeTab from "@/components/PlayerDetails/TradeTab/TradeTab.vue";
import GovernmentTab from "@/components/PlayerDetails/GovernmentTab/GovernmentTab.vue";

const playerDetails = usePlayerDetailsStore();
const objects = useObjectsStore();
const activeTab = computed(() => playerDetails.activeTab);
</script>

<template>
  <UiModal
    :open="playerDetails.isOpen"
    @close="playerDetails.close()"
  >
    <!-- Tabs -->
    <template #header-left>
      <div
        class="flex flex-wrap items-center gap-1 border-b border-slate-700 bg-emerald-950"
      >
        <button
          v-for="tabConfig in tabsConfig"
          :key="tabConfig.name"
          class="px-3 py-1.5 rounded-t-lg text-sm transition-colors inline-flex items-center gap-1"
          :class="
            activeTab === tabConfig.name
              ? 'bg-yellow-600 text-slate-900'
              : 'text-slate-200 hover:bg-yellow-600 hover:text-slate-900'
          "
          type="button"
          @click="playerDetails.switchTab(tabConfig.name)"
        >
          <UiIcon
            :icon="objects.getTypeObject(tabConfig.type).icon"
            class="fa-fw"
          />
          <span>{{ tabConfig.name }}</span>
        </button>
      </div>
    </template>

    <!-- Content: keep all tabs mounted; toggle with v-show so state persists -->
    <div class="overflow-y-auto h-full w-full">
      <EconomyTab v-show="activeTab === 'Economy'" />
      <ResearchTab v-show="activeTab === 'Research'" />
      <CultureTab v-show="activeTab === 'Culture'" />
      <ReligionTab v-show="activeTab === 'Religion'" />
      <DiplomacyTab v-show="activeTab === 'Diplomacy'" />
      <CitiesTab v-show="activeTab === 'Cities'" />
      <UnitsTab v-show="activeTab === 'Military'" />
      <TradeTab v-show="activeTab === 'Trade'" />
      <GovernmentTab v-show="activeTab === 'Government'" />
    </div>
  </UiModal>
</template>
