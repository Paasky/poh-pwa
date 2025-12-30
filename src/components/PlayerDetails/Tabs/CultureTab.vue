<script setup lang="ts">
import UiGrid from "@/components/Ui/UiGrid.vue";
import UiObjectCards from "@/components/Ui/UiObjectCards.vue";
import { TypeObject } from "@/Common/Objects/TypeObject";
import UiCols from "@/components/Ui/UiCols.vue";
import { useCultureTabStore } from "@/components/PlayerDetails/Tabs/cultureTabStore";
import { CatKey, Set<TypeObject> } from "@/Data/useDataBucket";

const store = useCultureTabStore();
</script>

<template>
  <div class="pa-2">
    <UiCols :cols="{ left: 9, right: 3 }">
      <template #left>
        <UiGrid :items="store.heritageCats" :col-count="5">
          <template #cell="{ item: CatKey, Set }">
            <UiObjectCards
              :title="(CatKey, Set<TypeObject> as CatKey, Set<TypeObject>).category.name"
              :types="(CatKey, Set<TypeObject> as CatKey, Set<TypeObject>).types"
              :selectable="store.culture.selectableTraits"
              :selected="store.culture.traits as TypeObject[]"
              :select-pos="'right'"
              :with-spacer="false"
              :show-or-between="true"
            />
          </template>
        </UiGrid>
        <UiGrid :items="store.traitCats" :col-count="4">
          <template #cell="{ item: CatKey, Set }">
            <UiObjectCards
              :title="(CatKey, Set<TypeObject> as CatKey, Set<TypeObject>).category.name"
              :types="(CatKey, Set<TypeObject> as CatKey, Set<TypeObject>).types"
              :selectable="store.culture.selectableTraits"
              :selected="store.culture.traits as TypeObject[]"
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
