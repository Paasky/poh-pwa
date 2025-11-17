<script setup lang="ts">
import UiObjPillList from '@/components/Ui/UiObjPillList.vue'
import UiYieldList from '@/components/Ui/UiYieldList.vue'
import UiObjPill from '@/components/Ui/UiObjPill.vue'
import UiCard from '@/components/Ui/UiCard.vue'
import UiCardGrid from '@/components/Ui/UiCardGrid.vue'
import UiCardGroup from '@/components/Ui/UiCardGroup.vue'
import UiButton from '@/components/Ui/UiButton.vue'
import { useObjectsStore } from '@/stores/objectStore'
import { Culture } from '@/types/gameObjects'
import { CultureManager } from '@/managers/cultureManager'

const objects = useObjectsStore()
const player = objects.getCurrentPlayer()
const culture = objects.getGameObject(player.culture) as Culture
const cultureManager = new CultureManager()
</script>

<template>
  <div class="px-4 py-2 w-full h-full">
    Debug:
    <UiButton @click="culture.status = 'notSettled'">Not Settled</UiButton>
    <UiButton @click="culture.status = 'canSettle'">Can Settle</UiButton>
    <UiButton @click="culture.status = 'mustSettle'">Must Settle</UiButton>
    <UiButton @click="culture.status = 'settled'">Is Settled</UiButton>
    <!--
    <UiButton @click="culture.positiveTraitsToSelect = culture.negativeTraitsToSelect = 0">0 Traits
    </UiButton>
    <UiButton @click="() => {culture.positiveTraitsToSelect = 3; culture.negativeTraitsToSelect = 2}">3+2
      Traits
    </UiButton>
    <UiButton @click="() => {culture.positiveTraitsToSelect = 2; culture.negativeTraitsToSelect = 0}">2+0
      Traits
    </UiButton>
    <UiButton @click="() => {culture.positiveTraitsToSelect = 0; culture.negativeTraitsToSelect = 1}">0+1
      Traits
    </UiButton>

    <!-- Trait selection
    <div v-if="culture.status === 'settled'" class="mb-4">
      <h1 class="text-xl mb-1">Traits</h1>
      <div class="text-sm grid gap-2 mb-4">
        <p v-if="culture.positiveTraitsToSelect + culture.negativeTraitsToSelect">
          You must select
          <b v-if="culture.positiveTraitsToSelect">{{ culture.positiveTraitsToSelect }} positive</b>
          <span v-if="culture.positiveTraitsToSelect && culture.negativeTraitsToSelect"> and </span>
          <b v-if="culture.negativeTraitsToSelect">{{ culture.negativeTraitsToSelect }} negative</b>
          <UiObjPill type="conceptType:trait"
                      :name="culture.positiveTraitsToSelect+culture.negativeTraitsToSelect === 1 ? 'Trait' : 'Traits'"/>
          for your Culture.
          These can only be modified during a
          <UiObjPill type="conceptType:revolution"/>
          .
        </p>
        <p v-else>
          You have selected all of your
          <UiObjPill type="conceptType:trait" name="Traits"/>
          . They can only be modified during a
          <UiObjPill type="conceptType:revolution"/>
          .
        </p>
      </div>
      <UiCardGrid gap="gap-4" :cols="['2xl:grid-cols-4', 'lg:grid-cols-3', 'sm:grid-cols-2', 'grid-cols-1']">
        <UiCardGroup v-for="catData in culture.traitsPerCategory">
          <h3 class="text-center">
            {{ catData.category.name }}
          </h3>
          <div class="flex gap-2 text-center">
            <template v-for="(typeData, i) of catData.typesData">
              <UiCard :title="type.name"
                      :disabled="!typeData.canSelect"
                      :selected="typeData.isSelected"
                      v-on:button-click="selectHeritage(type)"
              >
                <div class="text-xs mt-0.5">
                  <UiYieldList :yields="type.yields"/>
                  <UiObjPillList :obj-keys="type.gains"/>
                </div>
                <UiButton v-if="culture.positiveTraitsToSelect + culture.negativeTraitsToSelect"
                          class="w-full my-1"
                          :disabled="!typeData.canSelect"
                          @click.stop="selectHeritage(type)"
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
      <div v-if="culture.status !== 'settled'" class="text-sm grid gap-2 mb-4">
        <p v-if="culture.status === 'notSettled' || culture.status === 'canSettle'">
          Explore your surroundings to discover and learn from the nature around you. These skills and knowledge will
          stay as your Cultural
          <UiObjPill objOrKey="conceptType:heritage"/>
          for the rest of the game.
        </p>
        <p v-if="culture.status === 'notSettled'">
          You must select at least <b>two Heritages</b> to settle your first city.
        </p>
        <h2 v-if="culture.status === 'canSettle' || culture.status === 'mustSettle'" class="text-lg my-2">
          <b>You are ready to settle your first city!</b>
        </h2>
        <p v-if="culture.status === 'canSettle' || culture.status === 'mustSettle'">
          Use your <b>Tribe</b> to create your first
          <UiObjPill objOrKey="conceptType:city"/>
          and turn the first page of your people's history.
        </p>
        <p v-if="culture.status === 'canSettle'">
          Settling down will lock your current Heritage for the rest of the game.
        </p>
        <p v-if="culture.status === 'mustSettle'">
          Your Heritage is full, so exploration will not grant you any more points.
        </p>
      </div>
      <UiCardGrid v-if="culture.status !== 'settled'">
        <UiCardGroup v-for="catData in objects.getClassTypesPerCategory('heritageType')">
          <div>
            {{ catData.category.name }}
            <h4 v-if="culture.status === 'notSettled' || culture.status === 'canSettle'"
                class="inline pl-1 text-xs">Get
              points from discovering:</h4>
            <div v-if="culture.status === 'notSettled' || culture.status === 'canSettle'" class="text-xs">
              <UiObjPillList :obj-keys="catData.types[0].requires" :no-margin="true"/>
            </div>
          </div>
          <UiCard v-for="type of catData.types"
                  :title="`${type.name} (${culture.heritageCategoryPoints[type.category!] ?? 0}/${type.heritagePointCost!})`"
                  :disabled="!culture.selectableHeritages.includes(type) || culture.heritages.includes(type)"
                  :selected="culture.heritages.includes(type)"
                  :can-open="true"
                  :is-open="culture.selectableHeritages.includes(type) || culture.heritages.includes(type)"
                  :button-text="culture.heritages.includes(type) ? 'Selected' : 'Select'"
                  :button-variant="culture.heritages.includes(type) ? 'selected' : 'solid'"
                  v-on:button-click="culture.selectableHeritages.includes(type) ? cultureManager.selectHeritage(culture, type) : null"
                  class="my-1"
          >
            <div class="text-xs">
              <UiYieldList :yields="type.yields"/>
              <UiObjPillList :obj-keys="type.gains"/>
            </div>
          </UiCard>
        </UiCardGroup>
      </UiCardGrid>

      <!-- Settled -->
      <UiCardGrid v-else>
        <template v-for="catData in objects.getClassTypesPerCategory('heritageType')">
          <UiCard v-for="type of catData.types.filter(h => culture.heritages.includes(h))"
                  :title="type.name"
                  class="my-1"
          >
            <div class="text-xs">
              <UiYieldList :yields="type.yields"/>
              <UiObjPillList :obj-keys="type.gains"/>
            </div>
          </UiCard>
        </template>
      </UiCardGrid>
    </div>
  </div>
</template>
