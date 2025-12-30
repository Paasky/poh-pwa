<script setup lang="ts">
import UiGrid from "@/components/Ui/UiGrid.vue";
import UiObjectCards from "@/components/Ui/UiObjectCards.vue";
import { TypeObject } from "@/Common/Objects/TypeObject";
import UiCols from "@/components/Ui/UiCols.vue";
import { useGovernmentTabStore } from "@/components/PlayerDetails/Tabs/governmentTabStore";
import { CatKey, Set<TypeObject> } from "@/Data/useDataBucket";

const store = useGovernmentTabStore();
</script>

<template>
  <div class="pa-2">
    <UiCols :cols="{ left: 9, right: 3 }">
      <template #left>
        <UiGrid :items="store.policyCats" :col-count="5" class="w-100">
          <template #cell="{ item: CatKey, Set }">
            <UiObjectCards
              :title="(CatKey, Set<TypeObject> as CatKey, Set<TypeObject>).category.name"
              title-class="text-h5"
              :types="(CatKey, Set<TypeObject> as CatKey, Set<TypeObject>).types"
              :selectable="store.government.selectablePolicies"
              :selected="store.government.policies as TypeObject[]"
              :select-pos="'right'"
              :with-spacer="true"
              :show-or-between="true"
              card-style="height: 9.5rem;"
            />
          </template>
        </UiGrid>
      </template>
      <template #right> </template>
    </UiCols>
  </div>
</template>

<style scoped></style>
