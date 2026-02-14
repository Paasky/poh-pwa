<script setup lang="ts" generic="T">
const model = defineModel<T>();

withDefaults(
  defineProps<{
    label: string;
    items: Record<string, unknown>[];
    itemTitle?: string;
    itemValue?: string;
  }>(),
  {
    itemTitle: "title",
    itemValue: "value",
  },
);
</script>

<template>
  <v-select
    v-model="model"
    :label="label"
    :items="items"
    :item-title="itemTitle"
    :item-value="itemValue"
    variant="outlined"
    density="comfortable"
    hide-details
  />
</template>
