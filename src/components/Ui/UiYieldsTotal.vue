<script setup lang="ts">
import { computed } from "vue";
import UiObjPill from "@/components/Ui/UiObjPill.vue";
import { Yield } from "@/objects/yield";

const props = defineProps<{
  data: Yield;
  hideName?: boolean;
  positive?: boolean;
  negative?: boolean;
}>();
defineEmits<{ (e: "click", ev: MouseEvent): void }>();

const amount = computed(() => {
  if (props.data.method === "set") return "Set to " + props.data.amount;
  return props.data.method === "percent"
    ? props.data.amount + "%"
    : props.data.amount;
});
</script>

<template>
  <span class="select-none">
    <UiObjPill
      :obj-or-key="data.type"
      :hide-name="hideName"
    >
      <span class="mr-1">{{ amount }}</span>
    </UiObjPill>
    <template v-if="data.for.length">
      for
      <template
        v-for="(type, i) in data.for"
        :key="JSON.stringify(type)"
      >
        <span v-if="i !== 0">, </span>
        <UiObjPill :obj-or-key="type" />
      </template>
    </template>
    <template v-if="data.vs.length">
      vs
      <template
        v-for="(type, i) in data.vs"
        :key="JSON.stringify(type)"
      >
        <span v-if="i !== 0">, </span>
        <UiObjPill :obj-or-key="type" />
      </template>
    </template>
  </span>
</template>
