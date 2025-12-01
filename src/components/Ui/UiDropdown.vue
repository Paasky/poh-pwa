<script setup lang="ts">
import { computed } from "vue";

type Option<T = unknown> = {
  label: string;
  value: T;
};

const props = withDefaults(
  defineProps<{
    label?: string;
    modelValue: unknown;
    options: Option<unknown>[];
    disabled?: boolean;
    class?: string;
  }>(),
  {
    disabled: false,
    label: undefined,
    class: undefined,
  },
);

const emit = defineEmits<{
  // eslint-disable-next-line
  (e: "update:modelValue", value: any): void;
}>();

const valueStr = computed({
  get: () => JSON.stringify(props.modelValue),
  set: (v: string) => emit("update:modelValue", JSON.parse(v)),
});
</script>

<template>
  <label class="block" :class="props.class">
    <span v-if="label" class="text-sm text-slate-300">{{ label }}</span>
    <select
      v-model="valueStr"
      :disabled="disabled"
      class="w-full mt-1 px-2 py-1 rounded bg-gray-800 border border-gray-700 disabled:opacity-50"
    >
      <option
        v-for="opt in options"
        :key="opt.label + ':' + JSON.stringify(opt.value)"
        :value="JSON.stringify(opt.value)"
      >
        {{ opt.label }}
      </option>
    </select>
  </label>
</template>

<style scoped></style>
