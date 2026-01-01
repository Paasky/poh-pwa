<script setup lang="ts" generic="T">
defineProps<{
  items: T[];
}>();
</script>

<template>
  <v-list density="compact" class="pa-0 bg-transparent">
    <v-list-item v-for="(item, index) in items" :key="index" class="pa-0 min-h-0">
      <slot :item="item" :index="index" />
    </v-list-item>
  </v-list>
</template>

<style scoped>
.min-h-0 {
  min-height: 0 !important;
}
</style>
