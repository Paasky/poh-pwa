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
const manager = new CultureManager()
</script>

<template>
  <div class="px-4 py-2 w-full h-full">
    Debug:
    <UiButton @click="culture.status = 'notSettled'">Not Settled</UiButton>
    <UiButton @click="culture.status = 'canSettle'">Can Settle</UiButton>
    <UiButton @click="culture.status = 'mustSettle'">Must Settle</UiButton>
    <UiButton @click="culture.status = 'settled'">Is Settled</UiButton>
    <UiButton
        @click="culture.mustSelectTraits.positive = culture.mustSelectTraits.negative = 0; manager.calcSelectable(culture)">
      0 Traits
    </UiButton>
    <UiButton
        @click="() => {culture.mustSelectTraits.positive = 3; culture.mustSelectTraits.negative = 2; manager.calcSelectable(culture)}">
      3+2
      Traits
    </UiButton>
    <UiButton
        @click="() => {culture.mustSelectTraits.positive = 2; culture.mustSelectTraits.negative = 0; manager.calcSelectable(culture)}">
      2+0
      Traits
    </UiButton>
    <UiButton
        @click="() => {culture.mustSelectTraits.positive = 0; culture.mustSelectTraits.negative = 1; manager.calcSelectable(culture)}">
      0+1
      Traits
    </UiButton>

    <!-- Trait selection -->
    <div v-if="culture.status === 'settled'" class="mb-4">
      <h1 class="text-xl mb-1">Traits</h1>
      <div class="text-sm grid gap-2 mb-4">
        <p v-if="culture.mustSelectTraits.positive + culture.mustSelectTraits.negative">
          You must select
          <b v-if="culture.mustSelectTraits.positive">{{ culture.mustSelectTraits.positive }} positive</b>
          <span v-if="culture.mustSelectTraits.positive && culture.mustSelectTraits.negative"> and </span>
          <b v-if="culture.mustSelectTraits.negative">{{ culture.mustSelectTraits.negative }} negative</b>
          <UiObjPill obj-or-key="conceptType:trait"
                     :name="culture.mustSelectTraits.positive+culture.mustSelectTraits.negative === 1 ? 'Trait' : 'Traits'"
          />
          for your Culture.
          These can only be modified during a
          <UiObjPill obj-or-key="conceptType:revolution"/>
          .
        </p>
        <p v-else>
          You have selected all of your
          <UiObjPill obj-or-key="conceptType:trait" name="Traits"/>
          . They can only be modified during a
          <UiObjPill obj-or-key="conceptType:revolution"/>
          .
        </p>
      </div>
      <UiCardGrid gap="gap-x-6 gap-y-4" :cols="['2xl:grid-cols-4', 'lg:grid-cols-3', 'sm:grid-cols-2', 'grid-cols-1']">
        <UiCardGroup v-for="catData in objects.getClassTypesPerCategory('traitType')">
          <h3 class="text-center">
            {{ catData.category.name }}
          </h3>
          <div class="flex gap-2 text-center">
            <template v-for="(trait, i) of catData.types">
              <UiCard :title="trait.name"
                      :disabled="!culture.selectableTraits.includes(trait)"
                      :selected="culture.traits.includes(trait)"
                      v-on:button-click="manager.selectTrait(culture, trait)"
              >
                <div class="text-xs mt-0.5">
                  <UiYieldList :yields="trait.yields"/>
                  <UiObjPillList :obj-keys="trait.gains"/>
                </div>
                <UiButton v-if="culture.mustSelectTraits.positive + culture.mustSelectTraits.negative"
                          class="w-full my-1"
                          :disabled="!culture.selectableTraits.includes(trait)"
                          @click.stop="manager.selectTrait(culture, trait)"
                >{{ culture.traits.includes(trait) ? 'Selected' : 'Select' }}
                </UiButton>
              </UiCard>
              <h4 v-if="i === 0" class="content-center text-sm italic">or</h4>
            </template>
          </div>
        </UiCardGroup>
      </UiCardGrid>
    </div>

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
      <UiCardGrid v-if="culture.status === 'notSettled' || culture.status === 'canSettle'">
        <UiCardGroup v-for="catData in objects.getClassTypesPerCategory('heritageType')">
          <div>
            {{ catData.category.name }} ({{ culture.heritageCategoryPoints[catData.category.key!] ?? 0 }})
            <h4 v-if="culture.status === 'notSettled' || culture.status === 'canSettle'"
                class="inline pl-1 text-xs"
            >
              Get points from:
              <UiButton @click="manager.addHeritagePoints(culture, catData.category.key, 1)">+</UiButton>
            </h4>
            <div v-if="culture.status === 'notSettled' || culture.status === 'canSettle'" class="text-xs">
              <UiObjPillList :obj-keys="catData.types[0].requires" :no-margin="true"/>
            </div>
          </div>
          <UiCard v-for="type of catData.types"
                  :title="`${type.name} (${type.heritagePointCost!})`"
                  :disabled="!culture.selectableHeritages.includes(type) || culture.heritages.includes(type)"
                  :selected="culture.heritages.includes(type)"
                  :can-open="true"
                  :is-open="culture.selectableHeritages.includes(type) || culture.heritages.includes(type)"
                  :button-text="culture.heritages.includes(type) ? 'Selected' : 'Select'"
                  :button-variant="culture.heritages.includes(type) ? 'selected' : 'solid'"
                  v-on:button-click="culture.selectableHeritages.includes(type) ? manager.selectHeritage(culture, type) : null"
                  class="my-1"
          >
            <div class="text-xs">
              <UiYieldList :yields="type.yields.filter(y => y.type !== 'yieldType:heritagePointCost')"/>
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
              <UiYieldList :yields="type.yields.filter(y => y.type !== 'yieldType:heritagePointCost')"/>
              <UiObjPillList :obj-keys="type.gains"/>
            </div>
          </UiCard>
        </template>
      </UiCardGrid>
    </div>
  </div>
</template>
