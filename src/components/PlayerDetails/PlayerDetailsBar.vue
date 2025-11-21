<script setup lang="ts">
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
  reqSettled: boolean
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
    reqSettled: tabConfig.reqSettled,
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
            : 'Select'
    )
    data.tooltip = computed(() => player.research.current
        ? `Research: ${player.research.current.name} (ready in ${player.research.turnsLeft} turns)`
        : 'Research: Select next Technology'
    )

    return data as TabData
  }

  if (tabConfig.name === 'Culture') {
    data.text = computed((): string => {
      if (culture.selectableHeritages.length) return 'Select'
      if (culture.selectableTraits.length) return 'Select'

      if (culture.status === 'notSettled') return 'Explore'
      if (culture.status === 'canSettle') return 'Can Settle'
      if (culture.status === 'mustSettle') return 'Must Settle'

      return player.yieldStorage.amount('yieldType:culture') + ''
    })
    data.tooltip = computed((): string => {
      if (culture.selectableHeritages.length) {
        return 'Culture: Can select a Heritage'
      }
      if (culture.status === 'notSettled') {
        return 'Culture: Explore your surroundings to gain Heritage Points'
      }
      if (culture.status === 'canSettle') {
        return 'Culture: Can use your Tribe to settle your first City'
      }
      if (culture.status === 'mustSettle') {
        return 'Culture: Use your Tribe to settle your first City'
      }

      if (culture.selectableTraits.length) {
        return 'Culture: Select Traits for your Culture'
      }

      return culture.name
    })

    return data as TabData
  }

  if (tabConfig.name === 'Religion') {
    data.text = computed((): string => {
      if (religion?.canEvolve) return 'Evolve'
      if (religion?.selectableMyths || religion?.selectableGods || religion?.selectableDogmas) return 'Select'

      return player.yieldStorage.amount('yieldType:faith') + ''
    })
    data.tooltip = computed((): string => {
      if (!religion) return 'Religion: No State Religion'
      if (religion.canEvolve) return 'Religion: Can be evolved'
      if (religion.selectableMyths) return 'Religion: Cn select a Myth'
      if (religion.selectableGods) return 'Religion: Cn select a God'
      if (religion.selectableDogmas) return 'Religion: Cn select a Dogma'

      return religion.name
    })

    return data as TabData
  }

  if (tabConfig.name === 'Diplomacy') {
    data.text = computed((): string => player.yieldStorage.amount('yieldType:influence') + '')
    data.tooltip = computed((): string => `Diplomacy: ${player.yieldStorage.amount('yieldType:influence')} influence`)

    return data as TabData
  }

  if (tabConfig.name === 'Cities') {
    data.text = computed((): string => player.cities.length + '')
    data.tooltip = computed((): string => `Cities: ${player.cities.length}`)

    return data as TabData
  }

  if (tabConfig.name === 'Military') {
    data.text = computed((): string => player.yieldStorage.amount('yieldType:designPoints') + '')
    data.tooltip = computed((): string => {
      const points = player.yieldStorage.amount('yieldType:designPoints')
      if (points < 2) {
        return `Military: ${points} Design Points (need 2 for new Unit Design)`
      }

      return `Military: ${points} Design Points (can create a new Unit Design)`
    })

    return data as TabData
  }

  if (tabConfig.name === 'Trade') {
    data.text = computed((): string => player.tradeRoutes.length + '')
    data.tooltip = computed((): string => `Trade: ${player.tradeRoutes.length} active Trade Routes`)

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
      <template v-for="tab of tabs" :key="tab.type.key">
        <UiButton v-if="!tab.reqSettled || culture.status === 'settled'" :key="tab.type.key"
                  @click="modal.open(tab.name)" variant="pill"
                  :tooltip="tab.tooltip?.value"
        >
          <UiIcon :icon="tab.type.icon" class="pr-1"/>
          <UiValue :value="tab.text.value"/>
        </UiButton>
      </template>
    </div>
  </UiElement>
</template>
