<script setup lang="ts">
// Ui components
import UiElement from '@/components/Ui/UiElement.vue'
import UiValue from '@/components/Ui/UiValue.vue'
import UiIcon from '@/components/Ui/UiIcon.vue'
import { useObjectsStore } from '@/stores/objectStore'
import UiButton from '@/components/Ui/UiButton.vue'
import { usePlayerDetailsStore } from '@/components/PlayerDetails/playerDetailsStore'
import { TypeKey } from '@/types/common'
import { Culture, Player, Religion } from '@/types/gameObjects'

const objects = useObjectsStore()
const player = objects.getGameObject(objects.world.currentPlayer) as Player
const culture = objects.getGameObject(player.culture) as Culture
const religion = player.religion ? objects.getGameObject(player.religion) as Religion : null
const modal = usePlayerDetailsStore()

const items = [
  {
    tab: 'Economy',
    type: 'yieldType:gold',
    text: player.yieldStorage.amount('yieldType:gold'),
  },
  {
    tab: 'Research',
    type: 'yieldType:science',
    isHidden: culture.status !== 'settled',
    text: player.research.current
        ? player.research.researching[player.research.current.key].progress
        + '/'
        + player.research.current.scienceCost
        + `(${player.research.turnsLeft})`
        : 'Choose',
    tooltip: player.research.current
        ? `${player.research.current.name} (ready in ${player.research.turnsLeft} turns)`
        : 'Choose a technology to research',
  },
  {
    tab: 'Culture',
    type: 'yieldType:culture',
    text: 0,
  },
  {
    tab: 'Religion',
    type: 'yieldType:faith',
    text: 0,
  },
  {
    tab: 'Diplomacy',
    type: 'yieldType:influence',
    text: 0,
  },
  {
    tab: 'Cities',
    type: 'conceptKey:city',
    text: 0,
  },
  {
    tab: 'Military',
    type: 'yieldType:defense',
    text: 0,
  },
  {
    tab: 'Trade',
    type: 'conceptType:tradeRoute',
    text: 0,
  },
  {
    tab: 'Government',
    type: 'conceptType:policy',
    text: 0,
  },
] as { tab: string, type: TypeKey, text: string, tooltip?: string, isHidden?: boolean }[]

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
      <template v-for="item in items" :key="item.type">
        <UiButton @click="modal.open(item.tab)" variant="pill" :tooltip="getDisplay(item.tab).tooltip">
          <UiIcon :icon="objects.get(item.typeKey).icon" class="pr-1"/>
          <UiValue :value="getDisplay(item.tab).text"/>
        </UiButton>
      </template>
    </div>
  </UiElement>
</template>
