<script setup lang="ts">
import { computed } from "vue";
import UiCardGroup from "@/components/UiLegacy/UiCardGroup.vue";
import UiCard from "@/components/UiLegacy/UiCard.vue";
import UiYieldList from "@/components/UiLegacy/UiYieldList.vue";
import UiObjPillList from "@/components/UiLegacy/UiObjPillList.vue";
import UiHeader from "@/components/UiLegacy/UiHeader.vue";
import UiObjPill from "@/components/UiLegacy/UiObjPill.vue";
import { useObjectsStore } from "@/stores/objectStore";
import { TypeKey } from "@/types/common";

const objects = useObjectsStore();
const player = objects.currentPlayer;
const religion = computed(() => player.religion.value);
const layout = {
  mythType: [
    0, // break on [0],
    // last row [1, 2, 3]
  ],
  godType: [
    1, // break on  [0, 1],
    4, // break on [2, 3, 4],
    // last row   [5, 6, 7, 8],
  ],
  dogmaType: [
    0, // break on     [0],ob
    2, // break on    [1, 2],
    5, // break on   [3, 4, 5],
    9, // break on [6, 7, 8, 9],
    // last row  [10, 11, 12, 13, 14],
  ],
};

const pyramids = [
  {
    title: "Myths",
    concept: "conceptType:myth" as TypeKey,
    layout: layout.mythType,
    typesPerCategory: objects.getClassTypesPerCategory("mythType"),
    selected: religion.value?.myths.value ?? [],
    selectable: religion.value?.selectableMyths.value ?? [],
  },
  {
    title: "Gods",
    concept: "conceptType:god" as TypeKey,
    layout: layout.godType,
    typesPerCategory: objects.getClassTypesPerCategory("godType"),
    selected: religion.value?.gods.value ?? [],
    selectable: religion.value?.selectableGods.value ?? [],
  },
  {
    title: "Dogmas",
    concept: "conceptType:dogma" as TypeKey,
    layout: layout.dogmaType,
    typesPerCategory: objects.getClassTypesPerCategory("dogmaType"),
    selected: religion.value?.dogmas.value ?? [],
    selectable: religion.value?.selectableDogmas.value ?? [],
  },
];
</script>

<template>
  <div class="select-none">
    <div
      v-for="(pyramid, i) of pyramids"
      :key="JSON.stringify(pyramid)"
      class="mb-6"
      :class="i > 0 ? 'border-t border-yellow-800/75' : ''"
    >
      <UiHeader class="mb-4" :title="pyramid.title" :type="pyramid.concept" />

      <div class="flex flex-wrap justify-center gap-x-12 gap-y-2">
        <template v-for="catData of pyramid.typesPerCategory" :key="JSON.stringify(catData)">
          <div class="inline-block">
            <UiCardGroup>
              <h3 class="text-center opacity-75">
                {{ catData.category.name }}
              </h3>
              <div
                class="gap-1 items-center"
                :class="catData.category.id === 'creation' ? 'flex' : 'grid'"
              >
                <template v-for="(type, iii) of catData.types" :key="type.key">
                  <div
                    v-if="iii !== 0"
                    class="text-xs text-center opacity-50 mb-0.5"
                    style="line-height: 0.5rem"
                  >
                    or
                  </div>
                  <UiCard
                    :button-text="pyramid.selectable.includes(type) ? 'Select' : ''"
                    :selected="pyramid.selected.includes(type)"
                    :disabled="!pyramid.selectable.includes(type)"
                    class="text-xs w-48"
                  >
                    <div class="border-b border-white/20 pb-1 mb-2">
                      <UiObjPill :obj-or-key="type" :hide-icon="true" />
                    </div>
                    <UiYieldList :yields="type.yields" :hide-name="true" />
                    <UiObjPillList :obj-keys="type.gains" />
                    <UiObjPillList :obj-keys="type.specials" />
                  </UiCard>
                </template>
              </div>
            </UiCardGroup>
          </div>
          <div v-if="pyramid.layout.includes(i)" class="basis-full w-full" />
        </template>
      </div>
    </div>
  </div>
</template>
