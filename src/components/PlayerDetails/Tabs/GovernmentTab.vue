<script setup lang="ts">
import UiGrid from "@/components/Ui/UiGrid.vue";
import UiObjectCards from "@/components/Ui/UiObjectCards.vue";
import { TypeObject } from "@/Common/Objects/TypeObject";
import UiCols from "@/components/Ui/UiCols.vue";
import { useGovernmentTabStore } from "@/components/PlayerDetails/Tabs/governmentTabStore";
import { CatData } from "@/stores/objectStore";

const store = useGovernmentTabStore();
</script>

<template>
  <div class="pa-2">
    <UiCols :cols="{ left: 9, right: 3 }">
      <template #left>
        <UiGrid :items="store.policyCats" :col-count="5" class="w-100">
          <template #cell="{ item: catData }">
            <UiObjectCards
              :title="(catData as CatData).category.name"
              title-class="text-h5"
              :types="(catData as CatData).types"
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
