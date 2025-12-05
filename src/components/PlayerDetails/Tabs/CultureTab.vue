<script setup lang="ts">
import { computed } from "vue";
import UiGrid from "@/components/Ui/UiGrid.vue";
import UiObjectCards from "@/components/Ui/UiObjectCards.vue";
import { CatData, useObjectsStore } from "@/stores/objectStore";
import { TypeObject } from "@/types/typeObjects";
import UiCols from "@/components/Ui/UiCols.vue";

const objStore = useObjectsStore();
const items = computed(() => objStore.getClassTypesPerCategory("traitType"));

const culture = objStore.currentPlayer.culture.value;
</script>

<template>
  <div class="pa-2">
    <UiCols :cols="{ left: 9, right: 3 }">
      <template #left>
        <UiGrid :items="objStore.getClassTypesPerCategory('heritageType')" :col-count="5">
          <template #cell="{ item: catData }">
            <UiObjectCards
              :title="(catData as CatData).category.name"
              :types="(catData as CatData).types"
              :selectable="culture.selectableTraits.value"
              :selected="culture.traits.value as TypeObject[]"
              :select-pos="'right'"
              :with-spacer="false"
              :show-or-between="true"
            />
          </template>
        </UiGrid>
        <UiGrid :items="objStore.getClassTypesPerCategory('traitType')" :col-count="4">
          <template #cell="{ item: catData }">
            <UiObjectCards
              :title="(catData as CatData).category.name"
              :types="(catData as CatData).types"
              :selectable="culture.selectableTraits.value"
              :selected="culture.traits.value as TypeObject[]"
              :select-pos="'right'"
              :with-spacer="false"
              :show-or-between="true"
            />
          </template>
        </UiGrid>
      </template>
      <template #right> </template>
    </UiCols>
  </div>
</template>
