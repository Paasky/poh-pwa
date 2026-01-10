<script setup lang="ts">
import UiGrid from "@/App/components/Ui/UiGrid.vue";
import UiObjectCards from "@/App/components/Ui/UiObjectCards.vue";
import { CatData, TypeObject } from "@/Common/Objects/TypeObject";
import UiCols from "@/App/components/Ui/UiCols.vue";
import { useCultureTabStore } from "@/App/components/PlayerDetails/Tabs/cultureTabStore";

const store = useCultureTabStore();
</script>

<template>
  <div class="pa-2">
    <UiCols :cols="{ left: 9, right: 3 }">
      <template #left>
        <UiGrid :items="Array.from(store.heritageCats.values())" :col-count="5">
          <template #cell="{ item }">
            <UiObjectCards
              :title="(item as CatData).category.name"
              :types="(item as CatData).types"
              :selectable="store.culture.selectableTraits"
              :selected="store.culture.traits as Set<TypeObject>"
              :select-pos="'right'"
              :with-spacer="false"
              :show-or-between="true"
            />
          </template>
        </UiGrid>
        <UiGrid :items="Array.from(store.traitCats.values())" :col-count="4">
          <template #cell="{ item }">
            <UiObjectCards
              :title="(item as CatData).category.name"
              :types="(item as CatData).types"
              :selectable="store.culture.selectableTraits"
              :selected="store.culture.traits as Set<TypeObject>"
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
