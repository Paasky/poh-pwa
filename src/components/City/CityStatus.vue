<script setup lang="ts">
import UiIcon from "@/components/Ui/UiIcon.vue";
import {City} from "@/types/gameObjects";

defineProps<{
  city: City
}>()
</script>

<template>
  <div v-for="status of city.status">
    <UiIcon :icon="status.icon"/>
    {{ status.text }}
  </div>
</template>

<style scoped>

</style>