<script setup lang="ts">
// Ui components
import UiElement from '@/components/Ui/UiElement.vue'
import UiValue from '@/components/Ui/UiValue.vue'
import UiIcon from '@/components/Ui/UiIcon.vue'
import { useObjectsStore } from '@/stores/objectStore'
import UiButton from '@/components/Ui/UiButton.vue'
import { TabName, tabsConfig, usePlayerDetailsStore } from '@/components/PlayerDetails/playerDetailsStore'
import { Culture, Player, Religion } from '@/types/gameObjects'
import { TypeObject } from '@/types/typeObjects'
import { computed, ComputedRef } from 'vue'

type TabData = {
  name: TabName,
  type: TypeObject,
  text: ComputedRef<string>,
  tooltip?: ComputedRef<string>,
  isHidden?: ComputedRef<boolean>
}

const objects = useObjectsStore()
const player = objects.getGameObject(objects.world.currentPlayer) as Player
const culture = objects.getGameObject(player.culture) as Culture
const religion = player.religion ? objects.getGameObject(player.religion) as Religion : null
const modal = usePlayerDetailsStore()

const tabs = tabsConfig.map(tabConfig => {
  const data = {
    name: tabConfig.name,
    type: objects.getTypeObject(tabConfig.type),
    text: undefined as any,
    tooltip: undefined as any,
    isHidden: undefined as any,
  }

  if (tabConfig.name === 'Economy') {
    data.text = computed((): string => player.yieldStorage.amount('yieldType:gold') + '')

    return data as TabData
  }

  if (tabConfig.name === 'Research') {
    data.isHidden = computed(() => culture.status !== 'settled')
    data.text = computed((): string =>
        player.research.current
            ? (player.research.researching[player.research.current.key]?.progress ?? 0)
            + '/'
            + player.research.current.scienceCost
            + ` (${player.research.turnsLeft})`
            : 'Choose'
    )
    data.tooltip = computed(() => player.research.current
        ? `${player.research.current.name} (ready in ${player.research.turnsLeft} turns)`
        : 'Choose a Technology to research'
    )

    return data as TabData
  }

  if (tabConfig.name === 'Culture') {
    data.text = computed((): string => {
      if (culture.selectableHeritages.length) return 'Choose'
      if (culture.selectableTraits.length) return 'Choose'

      if (culture.status === 'notSettled') return 'Explore'
      if (culture.status === 'canSettle') return 'Can Settle'
      if (culture.status === 'mustSettle') return 'Must Settle'

      return player.yieldStorage.amount('yieldType:culture') + ''
    })
    data.tooltip = computed((): string => {
      if (culture.selectableHeritages.length) {
        return 'Can choose a Heritage'
      }
      if (culture.status === 'notSettled') {
        return 'Explore your surroundings to gain Heritage Points'
      }
      if (culture.status === 'canSettle') {
        return 'Can use your Tribe to settle your first City'
      }
      if (culture.status === 'mustSettle') {
        return 'Use your Tribe to settle your first City'
      }

      if (culture.selectableTraits.length) {
        return 'Choose Traits for your Culture'
      }

      return culture.name
    })

    return data as TabData
  }

  if (tabConfig.name === 'Religion') {
    data.text = computed((): string => {
      if (religion?.canEvolve) return 'Evolve'
      if (religion?.selectableMyths || religion?.selectableGods || religion?.selectableDogmas) return 'Choose'

      return player.yieldStorage.amount('yieldType:faith') + ''
    })
    data.tooltip = computed((): string => {
      if (!religion) return 'No State Religion'
      if (religion.canEvolve) return 'You can evolve your Religion'
      if (religion.selectableMyths) return 'You can choose a Myth for your Religion'
      if (religion.selectableGods) return 'You can choose a God for your Religion'
      if (religion.selectableDogmas) return 'You can choose a Dogma for your Religion'

      return religion.name
    })

    return data as TabData
  }

  if (tabConfig.name === 'Diplomacy') {
    data.text = computed((): string => player.yieldStorage.amount('yieldType:influence') + '')

    return data as TabData
  }

  if (tabConfig.name === 'Cities') {
    data.text = computed((): string => player.cities.length + '')

    return data as TabData
  }

  if (tabConfig.name === 'Military') {
    data.text = computed((): string => player.units.length + '')

    return data as TabData
  }

  if (tabConfig.name === 'Trade') {
    data.text = computed((): string => player.tradeRoutes.length + '')

    return data as TabData
  }

  if (tabConfig.name === 'Government') {
    data.text = computed((): string => 'Stable')

    return data as TabData
  }

  throw new Error(`Unknown tab: ${tabConfig.name}`)
}) as TabData[]
</script>

<template>
  <UiElement position="top-left" class="z-50 text-base">
    <div class="flex items-center gap-1 pb-0.5 pr-1">
      <UiButton v-for="tab of tabs" :key="tab.type.key"
                @click="modal.open(tab.name)" variant="pill"
                :tooltip="tab.tooltip?.value"
      >
        <UiIcon :icon="tab.type.icon" class="pr-1"/>
        <UiValue :value="tab.text.value"/>
      </UiButton>
    </div>
  </UiElement>
</template>
