<script setup lang="ts">
import { computed } from "vue";
import { Yield } from "@/objects/yield";
import { useObjectsStore } from "@/stores/objectStore";
import UiObjectChips from "@/components/Ui/UiObjectChips.vue";
import getIcon from "@/types/icons";

export type yieldProps = {
  opts?: {
    posLumpIsNeutral?: boolean;
    showName?: boolean;
  };
};

const props = defineProps<{ y: Yield } & yieldProps>();
const type = computed(() => useObjectsStore().getTypeObject(props.y.type));
const icon = computed(() => getIcon(type.value.key));

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
  if (y.amount > 0 && !props.opts?.posLumpIsNeutral) {
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

  // Respect opts first
  if (props.opts?.posLumpIsNeutral && y.amount > 0 && y.method === "lump") return "";

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
  <div class="d-flex align-center ga-1" style="user-select: none">
    <div :style="{ color: color(y) }">{{ amount(y) }}</div>
    <v-tooltip :text="type.name" content-class="text-grey bg-grey-darken-4" location="bottom">
      <template #activator="{ props: tip }">
        <v-icon
          v-bind="tip"
          :icon="icon.icon.iconName"
          :color="icon.color"
          size="x-small"
          class="mx-1"
        />
        <div v-if="opts?.showName">{{ type.name }}</div>
      </template>
    </v-tooltip>
    <div v-if="y.for.length" class="d-flex align-center ga-1">
      for
      <UiObjectChips :types="y.for" />
    </div>
    <div v-if="y.vs.length" class="d-flex align-center ga-1">
      vs
      <UiObjectChips :types="y.vs" />
    </div>
  </div>
</template>

<style scoped></style>
