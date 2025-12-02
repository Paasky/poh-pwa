<script setup lang="ts">
import { computed } from "vue";
import UiObjPill from "@/components/UiLegacy/UiObjPill.vue";
import { Yield } from "@/objects/yield";

const props = defineProps<{
  data: Yield;
  hideName?: boolean;
  positive?: boolean;
  negative?: boolean;
  noLumpPlus?: boolean;
}>();
defineEmits<{ (e: "click", ev: MouseEvent): void }>();

const flipEffectTypes = [
  "yieldType:damage",
  "yieldType:influenceCost",
  "yieldType:moveCost",
  "yieldType:productionCost",
  "yieldType:scienceCost",
];
const noEffectTypes = ["yieldType:productionCost"];
const noPlusTypes = ["yieldType:intercept"];
const noLumpPlusTypes = ["yieldType:productionCost", "yieldType:scienceCost"];

const amount = computed(() => {
  if (props.data.method === "set") return "Set to " + props.data.amount;
  const output = props.data.method === "percent" ? props.data.amount + "%" : props.data.amount;

  if (props.data.amount <= 0) return output;
  if (noPlusTypes.includes(props.data.type)) return output;
  if (props.data.method === "lump" && props.noLumpPlus) return output;
  if (props.data.method === "lump" && noLumpPlusTypes.includes(props.data.type)) return output;

  return "+" + output;
});

const colorClass = computed<string>(() => {
  if (props.positive) return "text-green-400";
  if (props.negative) return "text-red-400";

  if (props.data.method === "lump" && noEffectTypes.includes(props.data.type)) return "";
  if (props.data.method === "set") return "text-green-400";

  if (flipEffectTypes.includes(props.data.type)) {
    if (props.data.amount > 0) return "text-red-400";
    if (props.data.amount < 0) return "text-green-400";
    return "";
  }
  if (props.data.amount > 0) return "text-green-400";
  if (props.data.amount < 0) return "text-red-400";
  return "";
});
</script>

<template>
  <span class="select-none">
    <UiObjPill :obj-or-key="data.type" :hide-name="hideName">
      <span :class="colorClass" class="mr-1">{{ amount }}</span>
    </UiObjPill>
    <template v-if="data.for.length">
      for
      <template v-for="(type, i) in data.for" :key="JSON.stringify(type)">
        <span v-if="i !== 0">, </span>
        <UiObjPill :obj-or-key="type" />
      </template>
    </template>
    <template v-if="data.vs.length">
      vs
      <template v-for="(type, i) in data.vs" :key="JSON.stringify(type)">
        <span v-if="i !== 0">, </span>
        <UiObjPill :obj-or-key="type" />
      </template>
    </template>
  </span>
</template>
