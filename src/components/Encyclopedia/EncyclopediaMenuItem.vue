<script setup lang="ts">
import type { MenuItem } from "@/components/Encyclopedia/EncyclopediaDialog.vue";

defineProps<{
  item: MenuItem;
  openSections: string[];
  toggle: (itemKey: string) => void;
}>();
</script>

<template>
  <div class="pl-2 py-1" @click.stop="toggle(item.key)" style="cursor: pointer">
    <div class="d-flex align-center">
      <v-icon
        v-if="Object.values(item.children ?? {}).length"
        :icon="openSections.includes(item.key) ? 'fa-minus' : 'fa-plus'"
        size="x-small"
        class="mr-2 opacity-30"
      />
      <span class="text-truncate" :title="item.title">{{ item.title }}</span>
    </div>
    <div v-if="Object.values(item.children ?? {}).length && openSections.includes(item.key)">
      <EncyclopediaMenuItem
        v-for="child in item.children"
        :key="child.key"
        class="ml-4"
        :item="child"
        :open-sections="openSections"
        :toggle="toggle"
      />
    </div>
  </div>
</template>

<style scoped></style>
