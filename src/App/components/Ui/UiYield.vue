<script setup lang="ts">
import { computed } from "vue";
import { Yield } from "@/Common/Static/Yields";
import { useDataBucket } from "@/Data/useDataBucket";
import UiObjectChips from "@/App/components/Ui/UiObjectChips.vue";
import UiIcon from "@/App/components/Ui/UiIcon.vue";

export type yieldProps = {
  opts?: {
    posLumpIsNeutral?: boolean;
    showName?: boolean;
    showProgress?: boolean;
    showProgressText?: boolean;
  };
};

const props = defineProps<{ y: Yield } & yieldProps>();
const type = computed(() => useDataBucket().getType(props.y.type));

function amount(y: Yield): string {
  // 0 is always neutral
  if (y.amount === 0) return y.amount + "";

  // Set-method
  if (y.method === "set") {
    return "Set to " + y.amount;
  }

  const type = useDataBucket().getType(y.type);
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

  const type = useDataBucket().getType(y.type);

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
const progressBg = computed(() => {
  // UnitHealth special thresholds
  if (props.y.type === "yieldType:health") {
    if (props.y.amount < 35) return "#881111";
    if (props.y.amount < 75) return "#f97316";
  }
  return "#082c00";
});
</script>

<template>
  <div
    :class="['d-flex', opts?.showProgress ? 'flex-column ga-0' : 'align-center ga-1']"
    style="user-select: none"
  >
    <div v-if="!opts?.showProgress" class="d-flex align-center ga-1">
      <div :style="{ color: color(y) }">
        {{ amount(y) }}<span v-if="y.max" class="opacity-70"> / {{ y.max }}</span>
      </div>
      <v-tooltip :text="type.name" content-class="text-grey bg-grey-darken-4" location="bottom">
        <template #activator="{ props: tip }">
          <div v-bind="tip" class="d-flex align-center">
            <UiIcon :icon="type.key" size="xs" class="mx-1" />
            <div v-if="opts?.showName">{{ type.name }}</div>
          </div>
        </template>
      </v-tooltip>
    </div>

    <v-progress-linear
      v-if="opts?.showProgress && y.max"
      :model-value="(y.amount / y.max) * 100"
      :color="progressBg"
      bg-opacity="1"
      height="18"
      rounded
      class="mt-1"
    >
      <template #default>
        <v-tooltip :text="type.name" content-class="text-grey bg-grey-darken-4" location="bottom">
          <template #activator="{ props: tip }">
            <div class="d-flex align-center ga-1 px-2 h-100" v-bind="tip">
              <UiIcon :icon="type.key" size="xs" />
              <span class="text-caption font-weight-bold" style="text-shadow: 0 0 2px black">
                {{ amount(y) }} / {{ y.max }}
              </span>
              <v-spacer />
              <div v-if="opts?.showName" class="text-caption opacity-70">{{ type.name }}</div>
            </div>
          </template>
        </v-tooltip>
      </template>
    </v-progress-linear>

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
