<script setup lang="ts">
import { computed } from 'vue'
import { tabsConfig, usePlayerDetailsStore } from '@/components/PlayerDetails/playerDetailsStore'
import UiIcon from '@/components/Ui/UiIcon.vue'
import { useObjectsStore } from '@/stores/objectStore'
import UiModal from '@/components/Ui/UiModal.vue'

const playerDetails = usePlayerDetailsStore()
const objects = useObjectsStore()
const activeTab = computed(() => playerDetails.activeTab)
</script>

<template>
  <UiModal :open="playerDetails.isOpen" @close="playerDetails.close()">
    <!-- Tabs -->
    <template #header-left class="flex flex-wrap items-center gap-1 border-b border-slate-700 bg-emerald-950">
      <button
          v-for="tabConfig in tabsConfig"
          :key="tabConfig.name"
          @click="playerDetails.switchTab(tabConfig.name)"
          class="px-3 py-1.5 rounded-t-lg text-sm transition-colors inline-flex items-center gap-1"
          :class="activeTab === tabConfig.name ? 'bg-yellow-600 text-slate-900' : 'text-slate-200 hover:bg-yellow-600 hover:text-slate-900'"
          type="button"
      >
        <UiIcon :icon="objects.getTypeObject(tabConfig.type).icon" class="fa-fw"/>
        <span>{{ tabConfig.name }}</span>
      </button>
    </template>

    <!-- Content: keep all tabs mounted; toggle with v-show so state persists -->
    <div class="overflow-y-auto h-full w-full">
      <GoldTab v-show="activeTab === 'Economy'"/>
      <ScienceTab v-show="activeTab === 'Research'"/>
      <CultureTab v-show="activeTab === 'Culture'"/>
      <FaithTab v-show="activeTab === 'Religion'"/>
      <InfluenceTab v-show="activeTab === 'Diplomacy'"/>
      <CitiesTab v-show="activeTab === 'Cities'"/>
      <MilitaryTab v-show="activeTab === 'Military'"/>
      <TradeTab v-show="activeTab === 'Trade'"/>
      <GovernmentTab v-show="activeTab === 'Government'"/>
    </div>
  </UiModal>
</template>
