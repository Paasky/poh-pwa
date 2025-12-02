<script setup lang="ts">
import { MenuItem } from "@/components/Encyclopedia/EncyclopediaDialog.vue";

defineProps<{
  item: MenuItem;
  openSections: string[];
}>();
</script>

<template>
  <div>
    <div class="d-flex align-center">
      <v-icon
        v-if="item.children?.length"
        :icon="openSections.includes(item.key) ? 'fa-xmark' : 'fa-bars'"
        size="x-small"
        class="mr-1 opacity-50"
      />
      <span class="text-truncate" :title="item.title">{{ item.title }}</span>
    </div>
    <div v-if="item.children?.length && openSections.includes(item.key)">
      <EncyclopediaMenuItem
        v-for="child in item.children"
        :key="child.key"
        :item="child"
        :open-sections="openSections"
      />
    </div>
  </div>
</template>

<style scoped></style>
