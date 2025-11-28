<script setup lang="ts">
import { computed } from 'vue'
import UiCardGroup from '@/components/Ui/UiCardGroup.vue'
import UiCard from '@/components/Ui/UiCard.vue'
import UiYieldList from '@/components/Ui/UiYieldList.vue'
import UiObjPillList from '@/components/Ui/UiObjPillList.vue'
import UiHeader from '@/components/Ui/UiHeader.vue'
import UiObjPill from '@/components/Ui/UiObjPill.vue'
import { useObjectsStore } from '@/stores/objectStore'
import { Religion } from '@/objects/gameObjects'

const objects = useObjectsStore()
const player = objects.getCurrentPlayer()
const religion = computed(() => player.religion ? objects.getGameObject(player.religion) as Religion : null)
const layout = {
  'mythType': [
    0, // break on [0],
    // last row [1, 2, 3]
  ],
  'godType': [
    1, // break on  [0, 1],
    4, // break on [2, 3, 4],
    // last row   [5, 6, 7, 8],
  ],
  'dogmaType': [
    0, // break on     [0],ob
    2, // break on    [1, 2],
    5, // break on   [3, 4, 5],
    9, // break on [6, 7, 8, 9],
    // last row  [10, 11, 12, 13, 14],
  ],
}

const pyramids = [
  {
    title: 'Myths',
    concept: 'conceptType:myth',
    layout: layout.mythType,
    typesPerCategory: objects.getClassTypesPerCategory('mythType'),
    selected: religion.value?.myths ?? [],
    selectable: religion.value?.selectableMyths ?? [],
  },
  {
    title: 'Gods',
    concept: 'conceptType:god',
    layout: layout.godType,
    typesPerCategory: objects.getClassTypesPerCategory('godType'),
    selected: religion.value?.gods ?? [],
    selectable: religion.value?.selectableGods ?? [],
  },
  {
    title: 'Dogmas',
    concept: 'conceptType:dogma',
    layout: layout.dogmaType,
    typesPerCategory: objects.getClassTypesPerCategory('dogmaType'),
    selected: religion.value?.dogmas ?? [],
    selectable: religion.value?.selectableDogmas ?? [],
  },
]
</script>

<template>
  <div class="select-none">
    <div v-for="(pyramid, i) of pyramids" class="mb-6" :class="i > 0 ? 'border-t border-yellow-800/75' : ''">
      <UiHeader class="mb-4" :title="pyramid.title" :type="pyramid.concept"/>

      <div class="flex flex-wrap justify-center gap-x-12 gap-y-2">
        <template v-for="(catData, i) of pyramid.typesPerCategory">
          <div class="inline-block">
            <UiCardGroup>
              <h3 class="text-center opacity-75">{{ catData.category.name }}</h3>
              <div class="gap-1 items-center"
                   :class="catData.category.id === 'creation' ? 'flex' : 'grid'">
                <template v-for="(type, i) of catData.types">
                  <div v-if="i!==0" class="text-xs text-center opacity-50 mb-0.5" style="line-height: 0.5rem;">or</div>
                  <UiCard
                      :buttonText="pyramid.selectable.includes(type) ? 'Select' : ''"
                      :selected="pyramid.selected.includes(type)"
                      :disabled="!pyramid.selectable.includes(type)"
                      class="text-xs w-48"
                  >
                    <div class="border-b border-white/20 pb-1 mb-2">
                      <UiObjPill :objOrKey="type" :hide-icon="true"/>
                    </div>
                    <UiYieldList :yields="type.yields" :hide-name="true"/>
                    <UiObjPillList :obj-keys="type.gains"/>
                    <UiObjPillList :obj-keys="type.specials"/>
                  </UiCard>
                </template>
              </div>
            </UiCardGroup>
          </div>
          <div v-if="pyramid.layout.includes(i)" class="basis-full w-full"></div>
        </template>
      </div>
    </div>
  </div>
</template>
