<script setup lang="ts">
import UiTypePill from "@/components/Ui/UiTypePill.vue";
import { CityProd } from "@/types/gameObjects";

defineProps<{
  prod: CityProd
}>()
</script>

<template>
  <div>
    <UiTypePill :obj-or-key="prod.type"/>
    {{ prod.progress }}/{{ prod.type.cost }}
    ({{ prod.turnsLeft }})
  </div>
</template>

<style scoped>

</style>