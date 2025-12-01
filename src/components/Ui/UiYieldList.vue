<script setup lang="ts">
import UiYield from "@/components/Ui/UiYield.vue";
import { Yields } from "@/types/common";

defineProps<{
  yields: Yields;
  hideName?: boolean;
}>();
</script>

<template>
  <p
    v-for="data in yields.all()"
    :key="JSON.stringify(data)"
    class="mb-1"
  >
    <UiYield
      :data="data"
      :hide-name="hideName"
      :no-lump-plus="true"
    />
  </p>
</template>
