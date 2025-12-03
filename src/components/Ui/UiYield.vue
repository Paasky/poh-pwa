<script setup lang="ts">
import { computed } from "vue";
import { Yield } from "@/objects/yield";
import { useObjectsStore } from "@/stores/objectStore";
import UiObjectChips from "@/components/Ui/UiObjectChips.vue";

const props = defineProps<{
  y: Yield;
}>();
const type = computed(() => useObjectsStore().getTypeObject(props.y.type));

function amount(y: Yield): string {
  // 0 is always neutral
  if (y.amount === 0) return y.amount + "";

  // Set-method
  if (y.method === "set") {
    return "Set to " + y.amount;
  }

  const type = useObjectsStore().getTypeObject(y.type);
  let out = y.amount + "";

  // Percent-method
  if (y.method === "percent") out += "%";

  // Positive amount
  if (y.amount > 0) {
    // Don't touch these types if positive lump
    if (
      y.method === "lump" &&
      [
        "goalPoints",
        "heritagePoint",
        "heritagePointCost",
        "influenceCost",
        "productionCost",
        "scienceCost",
        "span",
      ].includes(type.id)
    ) {
      return out;
    }

    // Add + sign
    out = "+" + out;
  }

  return out;
}
function color(y: Yield): string {
  // 0 is always neutral
  if (y.amount === 0) return "";

  const type = useObjectsStore().getTypeObject(y.type);

  // These types are neutral if positive lump
  if (
    [
      "goalPoints",
      "heritagePoint",
      "heritagePointCost",
      "influenceCost",
      "productionCost",
      "scienceCost",
      "span",
    ].includes(type.id) &&
    y.amount > 0 &&
    y.method === "lump"
  ) {
    return "";
  }

  // Opposite: + is bad, - is good
  const isOpposite = [
    "moveCost",
    "heritagePointCost",
    "influenceCost",
    "productionCost",
    "scienceCost",
    "upkeep",
  ].includes(type.id);

  const isPositive = isOpposite ? y.amount < 0 : y.amount > 0;

  if (isPositive) return "#00ff00";
  return "#ff0000";
}
</script>

<template>
  <div class="d-flex ga-1">
    <div :style="{ color: color(y) }">{{ amount(y) }}</div>
    <div>{{ type.name }}</div>
    <div v-if="y.for.length" class="d-flex ga-1">
      for
      <UiObjectChips :types="y.for" />
    </div>
    <div v-if="y.vs.length" class="d-flex ga-1">
      vs
      <UiObjectChips :types="y.vs" />
    </div>
  </div>
</template>

<style scoped></style>
