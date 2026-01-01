<script setup lang="ts">
import { useGovernmentTabStore } from "@/components/PlayerDetails/Tabs/governmentTabStore";
import { CatData, TypeObject } from "@/Common/Objects/TypeObject";
import UiCols from "@/components/Ui/UiCols.vue";
import UiObjectCards from "@/components/Ui/UiObjectCards.vue";
import UiGrid from "@/components/Ui/UiGrid.vue";

const store = useGovernmentTabStore();
</script>

<template>
  <div class="pa-2">
    <UiCols :cols="{ left: 9, right: 3 }">
      <template #left>
        <UiGrid :items="Array.from(store.policyCats.values())" :col-count="5" class="w-100">
          <template #cell="{ item }">
            <UiObjectCards
              :title="(item as CatData).category.name"
              title-class="text-h5"
              :types="(item as CatData).types"
              :selectable="store.government.selectablePolicies"
              :selected="store.government.policies as Set<TypeObject>"
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
