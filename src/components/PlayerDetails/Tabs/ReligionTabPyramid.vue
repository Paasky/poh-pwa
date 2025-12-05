<script setup lang="ts">
import { computed } from "vue";
import UiObjectCards from "@/components/Ui/UiObjectCards.vue";
import { Religion } from "@/objects/game/Religion";
import { CatKey } from "@/types/common";
import { CategoryObject, TypeObject } from "@/types/typeObjects";
import { useObjectsStore } from "@/stores/objectStore";

const props = defineProps<{
  title: string;
  catPyramid: CatKey[][];
  current: Religion;
}>();

const objStore = useObjectsStore();

type CatData = {
  cat: CategoryObject;
  types: TypeObject[];
};

function buildPyramid(pyramid: CatKey[][], selectedTypes: TypeObject[]): CatData[][] {
  return pyramid.map((row) =>
    row.map((catKey) => {
      const catTypes = objStore.getCategoryTypes(catKey);
      const catIsSelected = selectedTypes.some((t) => t.category === catKey);

      return {
        cat: objStore.getCategoryObject(catKey),
        // If the category is selected, only show the selected types
        types: catIsSelected
          ? [...catTypes.filter((t) => selectedTypes.find((st) => t.key === st.key))]
          : catTypes,
      };
    }),
  );
}

const pyramid = computed(() => buildPyramid(props.catPyramid, props.current.myths as TypeObject[]));
</script>

<template>
  <div class="d-flex flex-column ga-2">
    <h2 class="mb-4" style="text-align: center">{{ title }}</h2>
    <div v-for="row in pyramid" :key="row.join(',')" class="d-flex ga-4 justify-center">
      <UiObjectCards
        v-for="catData in row"
        :key="catData.cat.key"
        :title="catData.cat.name"
        :types="catData.types"
        :selected="current.myths.value as TypeObject[]"
        :selectable="current.selectableMyths.value"
        :select-pos="'bottom'"
        :with-spacer="false"
        :show-or-between="true"
      />
    </div>
  </div>
</template>

<style scoped></style>
