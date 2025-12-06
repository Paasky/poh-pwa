<script setup lang="ts">
import { computed } from "vue";
import { TypeObject } from "@/types/typeObjects";
import { CatKey } from "@/types/common";
import ResearchTabArrows from "./ResearchTabArrows.vue";
import UiHeader from "@/components/Ui/UiHeader.vue";
import UiObjectCard from "@/components/Ui/UiObjectCard.vue";
import { useResearchTabStore } from "@/components/PlayerDetails/Tabs/researchTabStore";

const store = useResearchTabStore();

// Base size controls (rem units)
const xSize = 5.5;
const ySize = 7;

const cardWidthRem = xSize * (20 / xSize);
const cardHeightRem = ySize * (10 / ySize);
const containerWidthRem = computed(() => store.maxX * xSize + cardWidthRem);
const containerHeightRem = computed(() => (store.maxY + 1.6) * ySize);

function eraY(era: TypeObject): number {
  // Find all techs in this era and return the lowest y among them
  const ys = store.techs.filter((t) => t.category === (era.key as CatKey)).map((t) => t.y ?? 0);

  return ys.length ? Math.min(...ys) : 0;
}
</script>

<template>
  <!-- Container sized in rems, holding a full-size SVG arrows canvas -->
  <div
    class="position-relative"
    :style="{
      height: `${containerHeightRem}rem`,
      width: `${containerWidthRem}rem`,
      margin: '1rem',
    }"
  >
    <ResearchTabArrows
      stroke-color-rgb="rgb(48, 48, 48)"
      :container-width-rem="containerWidthRem"
      :container-height-rem="containerHeightRem"
      :x-size="xSize"
      :y-size="ySize"
      :card-width-rem="cardWidthRem"
      :card-height-rem="cardHeightRem"
    />

    <!-- Era headers from legacy, migrated to Vuetify UiHeader -->
    <UiHeader
      v-for="(era, i) in store.eras"
      :key="era.key"
      class="position-absolute"
      :style="{
        top: i > 0 ? `${(eraY(era) - 1.125) * ySize}rem` : `${(eraY(era) - 1) * ySize}rem`,
        left: '-1rem',
        width: `${containerWidthRem + 2.8}rem`,
        borderTop: i > 0 ? '1px solid rgba(133, 77, 14, 0.75)' : undefined,
      }"
      :title="`${era.name} Era`"
      :type="era"
    />

    <!-- Technology cards using UiObjectCard -->
    <div
      v-for="tech in store.techs"
      :key="tech.key"
      class="position-absolute"
      :style="{
        left: `${tech.x! * xSize}rem`,
        top: `${tech.y! * ySize}rem`,
        width: `${cardWidthRem}rem`,
        height: `${cardHeightRem}rem`,
        cursor:
          !store.research.researched.value.includes(tech) && store.research.current.value !== tech
            ? 'pointer'
            : 'default',
      }"
      @click="
        (e: MouseEvent) => {
          if (
            !store.research.researched.value.includes(tech) &&
            store.research.current.value !== tech
          ) {
            // Reset queue unless Shift is held while clicking
            store.research.addToQueue(tech, !e.shiftKey);
          }
        }
      "
    >
      <UiObjectCard
        class="h-100"
        :type="tech"
        :canSelect="!store.research.researched.value.includes(tech)"
        :isSelected="
          store.research.queue.value.includes(tech) || store.research.current.value === tech
        "
      />
    </div>
  </div>
</template>
