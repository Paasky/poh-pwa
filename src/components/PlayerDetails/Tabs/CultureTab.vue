<script setup lang="ts">
import UiTypePillList from '@/components/Ui/UiTypePillList.vue'
import UiYieldList from '@/components/Ui/UiYieldList.vue'
import UiTypePill from '@/components/Ui/UiTypePill.vue'
import UiCard from '@/components/Ui/UiCard.vue'
import { TypeObject } from '@/types/typeObjects'
import UiCardGrid from '@/components/Ui/UiCardGrid.vue'
import UiCardGroup from '@/components/Ui/UiCardGroup.vue'
import UiButton from '@/components/Ui/UiButton.vue'
import { usePlayersStore } from '@/stores/players'

const player = usePlayersStore().current

function selectHeritage (heritage: TypeObject) {
  // do something later
  console.log(heritage)
}
</script>

<template>
  <div class="px-4 py-2 w-full h-full">
    Debug:
    <UiButton @click="player.culture.status = 'notSettled'">Not Settled</UiButton>
    <UiButton @click="player.culture.status = 'canSettle'">Can Settle</UiButton>
    <UiButton @click="player.culture.status = 'mustSettle'">Must Settle</UiButton>
    <UiButton @click="player.culture.status = 'settled'">Is Settled</UiButton>
    <!--
    <UiButton @click="player.culture.positiveTraitsToSelect = player.culture.negativeTraitsToSelect = 0">0 Traits
    </UiButton>
    <UiButton @click="() => {player.culture.positiveTraitsToSelect = 3; player.culture.negativeTraitsToSelect = 2}">3+2
      Traits
    </UiButton>
    <UiButton @click="() => {player.culture.positiveTraitsToSelect = 2; player.culture.negativeTraitsToSelect = 0}">2+0
      Traits
    </UiButton>
    <UiButton @click="() => {player.culture.positiveTraitsToSelect = 0; player.culture.negativeTraitsToSelect = 1}">0+1
      Traits
    </UiButton>

    <!-- Trait selection
    <div v-if="player.culture.status === 'settled'" class="mb-4">
      <h1 class="text-xl mb-1">Traits</h1>
      <div class="text-sm grid gap-2 mb-4">
        <p v-if="player.culture.positiveTraitsToSelect + player.culture.negativeTraitsToSelect">
          You must select
          <b v-if="player.culture.positiveTraitsToSelect">{{ player.culture.positiveTraitsToSelect }} positive</b>
          <span v-if="player.culture.positiveTraitsToSelect && player.culture.negativeTraitsToSelect"> and </span>
          <b v-if="player.culture.negativeTraitsToSelect">{{ player.culture.negativeTraitsToSelect }} negative</b>
          <UiTypePill type="conceptType:trait"
                      :name="player.culture.positiveTraitsToSelect+player.culture.negativeTraitsToSelect === 1 ? 'Trait' : 'Traits'"/>
          for your Culture.
          These can only be modified during a
          <UiTypePill type="conceptType:revolution"/>
          .
        </p>
        <p v-else>
          You have selected all of your
          <UiTypePill type="conceptType:trait" name="Traits"/>
          . They can only be modified during a
          <UiTypePill type="conceptType:revolution"/>
          .
        </p>
      </div>
      <UiCardGrid gap="gap-4" :cols="['2xl:grid-cols-4', 'lg:grid-cols-3', 'sm:grid-cols-2', 'grid-cols-1']">
        <UiCardGroup v-for="catData in player.culture.traitsPerCategory">
          <h3 class="text-center">
            {{ catData.category.name }}
          </h3>
          <div class="flex gap-2 text-center">
            <template v-for="(typeData, i) of catData.typesData">
              <UiCard :title="typeData.type.name"
                      :disabled="!typeData.canSelect"
                      :selected="typeData.isSelected"
                      v-on:button-click="selectHeritage(typeData.type)"
              >
                <div class="text-xs mt-0.5">
                  <UiYieldList :yields="typeData.type.yields"/>
                  <UiTypePillList :type-keys="typeData.type.gains"/>
                </div>
                <UiButton v-if="player.culture.positiveTraitsToSelect + player.culture.negativeTraitsToSelect"
                          class="w-full my-1"
                          :disabled="!typeData.canSelect"
                          @click.stop="selectHeritage(typeData.type)"
                >{{ typeData.isSelected ? 'Selected' : 'Select' }}
                </UiButton>
              </UiCard>
              <h4 v-if="i === 0" class="content-center text-sm">or</h4>
            </template>
          </div>
        </UiCardGroup>
      </UiCardGrid>
    </div>
    -->

    <!-- Heritage selection -->
    <div>
      <h1 class="text-xl my-2">Heritage</h1>

      <!-- Not yet settled -->
      <div v-if="player.culture.status !== 'settled'" class="text-sm grid gap-2 mb-4">
        <p v-if="player.culture.status === 'notSettled' || player.culture.status === 'canSettle'">
          Explore your surroundings to discover and learn from the nature around you. These skills and knowledge will
          stay as your Cultural
          <UiTypePill objOrKey="conceptType:heritage"/>
          for the rest of the game.
        </p>
        <p v-if="player.culture.status === 'notSettled'">
          You must select at least <b>two Heritages</b> to settle your first city.
        </p>
        <h2 v-if="player.culture.status === 'canSettle' || player.culture.status === 'mustSettle'" class="text-lg my-2">
          <b>You are ready to settle your first city!</b>
        </h2>
        <p v-if="player.culture.status === 'canSettle' || player.culture.status === 'mustSettle'">
          Use your <b>Tribe</b> to create your first
          <UiTypePill objOrKey="conceptType:city"/>
          and turn the first page of your people's history.
        </p>
        <p v-if="player.culture.status === 'canSettle'">
          Settling down will lock your current Heritage for the rest of the game.
        </p>
        <p v-if="player.culture.status === 'mustSettle'">
          Your Heritage is full, so exploration will not grant you any more points.
        </p>
      </div>
      <UiCardGrid v-if="player.culture.status !== 'settled'">
        <UiCardGroup v-for="catData in player.culture.heritagesPerCategory">
          <div>
            {{ catData.category.name }}
            <h4 v-if="player.culture.status === 'notSettled' || player.culture.status === 'canSettle'"
                class="inline pl-1 text-xs">Get
              points from discovering:</h4>
            <div v-if="player.culture.status === 'notSettled' || player.culture.status === 'canSettle'" class="text-xs">
              <UiTypePillList :type-keys="catData.typesData[0].type.requires" :no-margin="true"/>
            </div>
          </div>
          <UiCard v-for="typeData of catData.typesData"
                  :title="`${typeData.type.name} (${catData.points}/${typeData.pointsRequired})`"
                  :disabled="!typeData.canSelect || typeData.isSelected"
                  :selected="typeData.isSelected"
                  :can-open="true"
                  :is-open="typeData.canSelect || typeData.isSelected"
                  :button-text="typeData.isSelected ? 'Selected' : 'Select'"
                  :button-variant="typeData.isSelected ? 'selected' : 'solid'"
                  v-on:button-click="selectHeritage(typeData.type)"
                  class="my-1"
          >
            <div class="text-xs">
              <UiYieldList :yields="typeData.type.yields"/>
              <UiTypePillList :type-keys="typeData.type.gains"/>
            </div>
          </UiCard>
        </UiCardGroup>
      </UiCardGrid>

      <!-- Settled -->
      <UiCardGrid v-else>
        <template v-for="catData in player.culture.heritagesPerCategory">
          <UiCard v-for="typeData of catData.typesData.filter(t => t.isSelected)"
                  :title="typeData.type.name"
                  class="my-1"
          >
            <div class="text-xs">
              <UiYieldList :yields="typeData.type.yields"/>
              <UiTypePillList :type-keys="typeData.type.gains"/>
            </div>
          </UiCard>
        </template>
      </UiCardGrid>
    </div>
  </div>
</template>
