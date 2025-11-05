<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { usePlayerDetailsStore } from '@/components/PlayerDetails/playerDetailsStore'
// Ui components (new Ui folder)
import UiIcon from '@/components/Ui/UiIcon.vue'

// Per-tab components
import GoldTab from './Tabs/GoldTab.vue'
import ScienceTab from './Tabs/ScienceTab.vue'
import CultureTab from './Tabs/CultureTab.vue'
import FaithTab from './Tabs/FaithTab.vue'
import InfluenceTab from './Tabs/InfluenceTab.vue'
import CitiesTab from './Tabs/CitiesTab.vue'
import MilitaryTab from './Tabs/MilitaryTab.vue'
import TradeTab from './Tabs/TradeTab.vue'
import GovernmentTab from './Tabs/GovernmentTab.vue'
import { useObjectsStore } from '@/stores/objects'
import UiModal from '@/components/Ui/UiModal.vue'

const playerDetails = usePlayerDetailsStore()
const objects = useObjectsStore()

// Local tabs config (moved from config.ts)
const ITEMS = [
  { tab: 'gold', typeKey: 'yieldType:gold', title: 'Gold' },
  { tab: 'science', typeKey: 'yieldType:science', title: 'Science' },
  { tab: 'culture', typeKey: 'yieldType:culture', title: 'Culture' },
  { tab: 'faith', typeKey: 'yieldType:faith', title: 'Faith' },
  { tab: 'influence', typeKey: 'yieldType:influence', title: 'Diplomacy' },
  { tab: 'cities', typeKey: 'conceptType:city', title: 'Cities' },
  { tab: 'military', typeKey: 'yieldType:defense', title: 'Military' },
  { tab: 'trade', typeKey: 'conceptType:tradeRoute', title: 'Trade' },
  { tab: 'government', typeKey: 'conceptType:policy', title: 'Government' },
] as const

function onKey (e: KeyboardEvent) {
  if (e.key === 'Escape') playerDetails.close()
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})

const activeTab = computed(() => playerDetails.activeTab)
</script>

<template>
  <UiModal :open="playerDetails.isOpen" @close="playerDetails.close()">
    <!-- Tabs -->
    <template #header-left class="flex flex-wrap items-center gap-1 border-b border-slate-700 bg-emerald-950">
      <button
          v-for="item in ITEMS"
          :key="item.tab"
          @click="playerDetails.switchTab(item.tab)"
          class="px-3 py-1.5 rounded-t-lg text-sm transition-colors inline-flex items-center gap-1"
          :class="activeTab === item.tab ? 'bg-yellow-600 text-slate-900' : 'text-slate-200 hover:bg-yellow-600 hover:text-slate-900'"
          type="button"
      >
        <UiIcon :icon="objects.get(item.typeKey).icon" class="fa-fw"/>
        <span>{{ item.title }}</span>
      </button>
    </template>

    <!-- Content: keep all tabs mounted; toggle with v-show so state persists -->
    <div class="overflow-y-auto h-full w-full">
      <GoldTab v-show="activeTab === 'gold'"/>
      <ScienceTab v-show="activeTab === 'science'"/>
      <CultureTab v-show="activeTab === 'culture'"/>
      <FaithTab v-show="activeTab === 'faith'"/>
      <InfluenceTab v-show="activeTab === 'influence'"/>
      <CitiesTab v-show="activeTab === 'cities'"/>
      <MilitaryTab v-show="activeTab === 'military'"/>
      <TradeTab v-show="activeTab === 'trade'"/>
      <GovernmentTab v-show="activeTab === 'government'"/>
    </div>
  </UiModal>
</template>
