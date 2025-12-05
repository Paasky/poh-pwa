<script setup lang="ts">

import { useObjectsStore } from '@/stores/objectStore'
import { CatKey, formatYear, getYearFromTurn } from '@/types/common'
import UiObjectCard from '@/components/Ui/UiObjectCard.vue'
import { computed, ref } from 'vue'
import { Religion } from '@/objects/game/Religion'
import UiCols from '@/components/Ui/UiCols.vue'
import UiTable from '@/components/Ui/UiTable.vue'
import { includes } from '@/helpers/textTools'
import { searchPlayer } from '@/components/PlayerDetails/Tabs/DiplomacyTab.vue'
import { CategoryObject, TypeObject } from '@/types/typeObjects'

const objStore = useObjectsStore()

// Static data for left column
const columns = []

// Static data for right column
const mythData = [
  [
    'mythCategory:creation'
  ],
  [
    'mythCategory:stars', 'mythCategory:humans', 'mythCategory:death'
  ],
] as any as CatKey[][]

const godData = [
  [
    'godCategory:kingOfGods',
    'godCategory:godMother'
  ],
  [
    'godCategory:godOfTheSea',
    'godCategory:godOfFertility',
    'godCategory:godOfTheMoon'
  ],
  [
    'godCategory:godOfFishing',
    'godCategory:godOfHunting',
    'godCategory:godOfTheHarvest',
    'godCategory:godOfFire'
  ],
] as any as CatKey[][]

const dogmaData = [
  [
    'dogmaCategory:gods'
  ],
  [
    'dogmaCategory:authority',
    'dogmaCategory:afterlife'
  ],
  [
    'dogmaCategory:support',
    'dogmaCategory:outreach',
    'dogmaCategory:deathRites'
  ],
  [
    'dogmaCategory:practice',
    'dogmaCategory:devotion',
    'dogmaCategory:belief',
    'dogmaCategory:monuments'
  ],
  [
    'dogmaCategory:expression',
    'dogmaCategory:journey',
    'dogmaCategory:identity',
    'dogmaCategory:texts',
    'dogmaCategory:service'
  ],
] as any as CatKey[][]
type CatData = {
  cat: CategoryObject,
  types: TypeObject[]
}

function buildPyramid (pyramid: CatKey[][], selectedTypes: TypeObject[]): CatData[][] {
  return pyramid.map(row => row.map(catKey => {
    const catTypes = objStore.getCategoryTypes(catKey)
    const catIsSelected = selectedTypes.some(t => t.category === catKey)

    return {
      cat: objStore.getCategoryObject(catKey),
      // If the category is selected, only show the selected types
      types: catIsSelected
          ? [...catTypes.filter(t => selectedTypes.find(st => t.key === st.key))]
          : catTypes,
    }
  }))
}

const religions = computed(() => objStore.getClassGameObjects('religion') as Religion[])

export function searchReligion (rel: Religion, term: string): boolean {
  return includes(rel.name, term)
      || includes(rel.city.value.name.value, term)
      || rel.players.value.some(p => searchPlayer(p, term))
}

function onRowClick (_e: unknown, payload: { item: unknown }) {
  current.value = payload.item as Religion
}

const current = ref<Religion | null>(null)
const mythPyramid = computed(() => buildPyramid(mythData, current.value?.myths as TypeObject[]))
const godPyramid = computed(() => buildPyramid(godData, current.value?.gods as TypeObject[]))
const dogmaPyramid = computed(() => buildPyramid(dogmaData, current.value?.dogmas as TypeObject[]))
</script>

<template>
  <UiCols>
    <template #left>
      <UiTable
          title="Religions"
          :columns="columns"
          :items="religions"
          :search="searchReligion"
          @click:row="onRowClick"
          :hover="true"
      />
    </template>
    <template #right>
      <div v-if="current">
        <h1>{{ current.name }}</h1>
        <div>Founded {{ formatYear(getYearFromTurn(current.foundedTurn)) }} in {{ current.city.name }}</div>
        <div>{{ current.citizenKeys.length }} followers, {{
            Math.round(
                current.citizenKeys.length / objStore.getClassGameObjects('citizen').length * 100
            )
          }}% of world population
        </div>

        <div>
          <h2 style="text-align: center">Mythology</h2>
          <div v-for="(row, rowI) in mythPyramid" :key="row.join(',')" class="d-flex ga-4 justify-center">
            <div v-for="catData in row" :key="rowI">
              <h4 class="mb-2" style="text-align: center">{{ catData.cat.name }}</h4>
              <div class="d-flex ga-1">
                <UiObjectCard v-for="type in catData.types"
                              :key="type.key"
                              :type="type"
                              :is-selected="current.myths.includes(type)"
                              :can-select="current.selectableMyths.includes(type)"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 style="text-align: center">Gods</h2>
          <div v-for="(row, rowI) in godPyramid" :key="row.join(',')" class="d-flex ga-4 justify-center">
            <div v-for="catData in row" :key="rowI">
              <h4 class="mb-2" style="text-align: center">{{ catData.cat.name }}</h4>
              <div class="d-flex ga-1">
                <UiObjectCard v-for="type in catData.types"
                              :key="type.key"
                              :type="type"
                              :is-selected="current.gods.includes(type)"
                              :can-select="current.selectableGods.includes(type)"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 style="text-align: center">Dogmas</h2>
          <div v-for="(row, rowI) in dogmaPyramid" :key="row.join(',')" class="d-flex ga-4 justify-center">
            <div v-for="catData in row" :key="rowI">
              <h4 class="mb-2" style="text-align: center">{{ catData.cat.name }}</h4>
              <div class="d-flex ga-1">
                <UiObjectCard v-for="type in catData.types"
                              :key="type.key"
                              :type="type"
                              :is-selected="current.dogmas.includes(type)"
                              :can-select="current.selectableDogmas.includes(type)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UiCols>
</template>
