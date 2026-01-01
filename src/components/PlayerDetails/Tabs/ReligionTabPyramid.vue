<script setup lang="ts">
import { computed } from "vue";
import UiObjectCards from "@/components/Ui/UiObjectCards.vue";
import { Religion } from "@/Common/Models/Religion";
import { CatKey } from "@/Common/Objects/Common";
import { CatData, TypeObject } from "@/Common/Objects/TypeObject";
import { useDataBucket } from "@/Data/useDataBucket";
import { filter, has } from "@/helpers/collectionTools";

const props = defineProps<{
  title: string;
  catPyramid: CatKey[][];
  current: Religion;
}>();

const bucket = useDataBucket();

function buildPyramid(pyramid: CatKey[][], selectedTypes: Set<TypeObject>): CatData[][] {
  return pyramid.map((row) =>
    row.map((catKey) => {
      const catTypes = bucket.getCategoryTypes(catKey);
      const catIsSelected = selectedTypes.some((t) => t.category === catKey);

      return {
        category: bucket.getCategory(catKey),
        // If the category is selected, only show the selected types
        types: catIsSelected
          ? [...filter(catTypes, (catType) => has(selectedTypes, catType))]
          : catTypes,
      } as CatData;
    }),
  );
}

const pyramid = computed(() => buildPyramid(props.catPyramid, props.current.myths as Set<TypeObject>));
</script>

<template>
  <div class="d-flex flex-column ga-2">
    <h2 class="mb-4" style="text-align: center">{{ title }}</h2>
    <div v-for="row in pyramid" :key="row.join(',')" class="d-flex ga-4 justify-center">
      <UiObjectCards
        v-for="catData in row"
        :key="catData.category.key"
        :title="catData.category.name"
        :types="Array.from(catData.types)"
        :selected="current.myths as Set<TypeObject>"
        :selectable="current.selectableMyths"
        :select-pos="'bottom'"
        :with-spacer="false"
        :show-or-between="true"
      />
    </div>
  </div>
</template>

<style scoped></style>
