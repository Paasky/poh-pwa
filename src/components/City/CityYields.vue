<script setup lang="ts">
import UiIcon from "@/components/Ui/UiIcon.vue";
import {City} from "@/types/gameObjects";
import UiYield from "@/components/Ui/UiYield.vue";

defineProps<{
  city: City
}>()
</script>

<template>
  <div v-for="y of Object.values(city.yields)">
    <UiYield :data="y" :hide-name="true" />
  </div>
</template>

<style scoped>

</style>