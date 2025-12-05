<script setup lang="ts">
import { computed } from "vue";
import UiGrid from "@/components/Ui/UiGrid.vue";
import UiObjectCards from "@/components/Ui/UiObjectCards.vue";
import { CatData, useObjectsStore } from "@/stores/objectStore";
import { TypeObject } from "@/types/typeObjects";
import UiCols from "@/components/Ui/UiCols.vue";

const objStore = useObjectsStore();
const items = computed(() => objStore.getClassTypesPerCategory("policyType"));

const government = objStore.currentPlayer.government;
</script>

<template>
  <div class="pa-2">
    <UiCols :cols="{ left: 9, right: 3 }">
      <template #left>
        <UiGrid :items="items" :col-count="5" class="w-100">
          <template #cell="{ item: catData }">
            <UiObjectCards
              :title="(catData as CatData).category.name"
              title-class="text-h5"
              :types="(catData as CatData).types"
              :selectable="government.selectablePolicies.value"
              :selected="government.policies.value as TypeObject[]"
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
