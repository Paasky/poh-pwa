<script setup lang="ts">
const model = defineModel<boolean>();

defineProps<{
  label: string;
}>();
</script>

<template>
  <v-switch v-model="model" :label="label" inset color="primary" hide-details />
</template>
