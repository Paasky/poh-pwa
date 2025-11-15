<script setup lang="ts">
import { type TabKey, usePlayerDetailsStore } from '@/components/PlayerDetails/playerDetailsStore'

// Ui components
import UiElement from '@/components/Ui/UiElement.vue'
import UiValue from '@/components/Ui/UiValue.vue'
import UiIcon from '@/components/Ui/UiIcon.vue'
import { useObjectsStore } from '@/stores/objectStore'
import UiButton from '@/components/Ui/UiButton.vue'
import { usePlayerScienceStore } from '@/components/PlayerDetails/Tabs/scienceStore'
import { usePlayerFaithStore } from '@/components/PlayerDetails/Tabs/faithStore'
import { usePlayersStore } from '@/stores/playerStore'

const objects = useObjectsStore()
const modal = usePlayerDetailsStore()

const player = usePlayersStore().current
const science = usePlayerScienceStore()
const faith = usePlayerFaithStore()

const items = [
  { tab: 'gold', typeKey: 'yieldType:gold' },
  { tab: 'science', typeKey: 'yieldType:science' },
  { tab: 'culture', typeKey: 'yieldType:culture' },
  { tab: 'faith', typeKey: 'yieldType:faith' },
  { tab: 'influence', typeKey: 'yieldType:influence' },
  { tab: 'cities', typeKey: 'yieldType:happiness' },
  { tab: 'cities', typeKey: 'yieldType:order' },
  { tab: 'military', typeKey: 'yieldType:defense' },
  { tab: 'trade', typeKey: 'conceptType:tradeRoute' },
  { tab: 'government', typeKey: 'conceptType:policy' },
] as { tab: TabKey, typeKey: string }[]

function getDisplay (tab: TabKey): { text: string, action?: boolean, tooltip?: string } {
  switch (tab) {
    case 'science': {
      const tech = science.currentResearchTech
      if (!tech) return { text: 'Choose' }
      return { text: `+0 (${tech.researched}/${tech.cost})`, tooltip: tech.type.name }
    }
    case 'culture': {
      if (player.culture.canSelectHeritage()) return {
        text: 'Choose',
        action: true,
        tooltip: 'You can choose a Heritage'
      }
      if (player.culture.status === 'notSettled') return {
        text: 'Explore',
        action: true,
        tooltip: 'Explore to gain Heritage points'
      }
      if (player.culture.status === 'canSettle') return {
        text: 'Can Settle',
        tooltip: 'Use your Tribe to Settle'
      }
      if (player.culture.status === 'mustSettle') return {
        text: 'Must Settle',
        action: true,
        tooltip: 'Use your Tribe to Settle'
      }
      return { text: player.yieldStorage.amount('yieldType:culture') + '' }
    }
    case 'faith': {
      if (!faith.stateReligion) return { text: 'None', tooltip: 'No State Religion' }
      if (faith.canSelectAnything) return { text: 'Choose', tooltip: faith.stateReligion.name }
      return { text: '0', tooltip: faith.stateReligion.name }
    }
    default:
      return { text: '0' }
  }
}
</script>

<template>
  <UiElement position="top-left" class="z-50 text-base">
    <div class="flex items-center gap-1 pb-0.5 pr-1">
      <template v-for="item in items" :key="item.typeKey">
        <UiButton @click="modal.open(item.tab)" variant="pill" :tooltip="getDisplay(item.tab).tooltip">
          <UiIcon :icon="objects.get(item.typeKey).icon" class="pr-1"/>
          <UiValue :value="getDisplay(item.tab).text"/>
        </UiButton>
      </template>
    </div>
  </UiElement>
</template>
