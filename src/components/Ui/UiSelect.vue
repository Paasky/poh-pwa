<script setup lang="ts" generic="T">
const model = defineModel<T>();

defineProps<{
  label: string;
  items: { title: string; value: T }[];
}>();
</script>

<template>
  <v-select
    v-model="model"
    :label="label"
    :items="items"
    variant="outlined"
    density="comfortable"
    hide-details
  />
</template>
