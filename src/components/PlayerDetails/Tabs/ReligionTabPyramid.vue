<script setup lang="ts">
import { computed } from "vue";
import UiObjectCard from "@/components/Ui/UiObjectCard.vue";
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
      <div
        v-for="catData in row"
        :key="catData.cat.key"
        class="pt-2 pa-1"
        style="border-radius: 0.5rem; background-color: rgba(255, 255, 255, 0.03)"
      >
        <h6 style="text-align: center">{{ catData.cat.name }}</h6>
        <div>
          <template v-for="(type, i) in catData.types" :key="type.key">
            <div
              v-if="i > 0"
              style="font-style: italic; opacity: 0.5; text-align: center; font-size: 0.75rem"
            >
              or
            </div>
            <UiObjectCard
              :type="type"
              :is-selected="current.myths.includes(type)"
              :can-select="current.selectableMyths.includes(type)"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
