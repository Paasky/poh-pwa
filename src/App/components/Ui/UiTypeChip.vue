<script setup lang="ts">
import { computed } from "vue";
import { ObjKey, PohObject, TypeKey } from "@/Common/Objects/Common";
import { useDataBucket } from "@/Data/useDataBucket";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { useEncyclopediaStore } from "@/App/components/Encyclopedia/encyclopediaStore";

const props = defineProps<{
  type: string | ObjKey | PohObject;
  // optional visual size; defaults match previous behavior
  size?: string;
}>();

const t = computed((): TypeObject => {
  if (typeof props.type === "string") return useDataBucket().getType(props.type as TypeKey);
  return props.type as TypeObject;
});

// Use background to denote Category
const bg = computed(() => {
  // culture: light purple
  // faith: dark pink
  // food: dark yellow
  // gold: bright yellow
  // happiness: bright green
  // health: red
  // influence: light gray
  // military: gray
  // order: dark blue
  // production: dark gray
  // science: light blue
  // trade: orange
  // other: dark gray
  return "#333";
});

// Use Border to denote Concept
const border = computed(() => {
  const lib = {
    // building: white
    "conceptType:building": "#ddd",

    // national wonder: bronze
    "conceptType:nationalWonder": "#850",

    // natural wonder/tile types: dark green
    "conceptType:naturalWonder": "#050",
    "conceptType:domain": "#050",
    "conceptType:climate": "#050",
    "conceptType:terrain": "#050",
    "conceptType:elevation": "#050",
    "conceptType:feature": "#050",
    "conceptType:flatLand": "#050",

    // improvement: light green
    "conceptType:improvement": "#090",

    // resource: orange
    "conceptType:resource": "#f90",

    // unit/equipment/platform: gray
    "conceptType:equipment": "#999",
    "conceptType:platform": "#999",

    // stockpile: red
    "conceptType:stockpile": "#900",
    "conceptType:pollution": "#900",

    // tech: bright blue
    "conceptType:era": "#59f",
    "conceptType:technology": "#59f",

    // world wonder: bright yellow
    "conceptType:worldWonder": "#aa0",
  } as Record<ObjKey, string>;

  // default: dark gray
  return lib[t.value.concept] ?? lib[t.value.key] ?? "#333";
});

const isCategory = computed(() => t.value.key.includes("Category:"));

const tooltip = computed(() => {
  const concept = useDataBucket().getType(t.value.concept).name;

  if (isCategory.value) {
    return concept + " Category";
  }

  if (t.value.category) {
    return `${useDataBucket().getCategory(t.value.category).name} ${concept}`;
  }

  return concept;
});
</script>

<template>
  <v-tooltip :text="tooltip" content-class="text-grey bg-grey-darken-4" location="bottom">
    <template #activator="{ props: tip }">
      <v-btn
        @click.stop="
          isCategory ? useEncyclopediaStore().toggle(t.key) : useEncyclopediaStore().open(t.key)
        "
        variant="elevated"
        :color="bg"
        rounded="xl"
        :size="props.size ?? 'x-small'"
        :style="`border: 1px solid ${border}`"
        v-bind="{ ...$attrs, ...tip }"
        >{{ t.name }}</v-btn
      >
    </template>
  </v-tooltip>
</template>

<style scoped></style>
