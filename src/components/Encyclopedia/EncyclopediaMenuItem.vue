<script setup lang="ts">
import {
  entryElemId,
  MenuItem,
  sectionElemId,
  useEncyclopediaStore,
} from "@/components/Encyclopedia/encyclopediaStore";
import UiIcon from "@/components/Ui/UiIcon.vue";

defineProps<{
  item: MenuItem;
}>();

const store = useEncyclopediaStore();
</script>

<template>
  <div
    :id="
      Object.values(item.children ?? {}).length ? sectionElemId(item.key) : entryElemId(item.key)
    "
    class="pl-2 py-1"
    @click.stop="
      Object.values(item.children ?? {}).length ? store.toggle(item.key) : store.open(item.key)
    "
    style="cursor: pointer"
  >
    <div class="d-flex align-center">
      <UiIcon
        v-if="Object.values(item.children ?? {}).length"
        :icon="store.openSections.has(item.key) ? 'minus' : 'plus'"
        size="xs"
        class="mr-2 opacity-30"
      />
      <span class="text-truncate" :title="item.title">{{ item.title }}</span>
    </div>
    <div v-if="Object.values(item.children ?? {}).length && store.openSections.has(item.key)">
      <EncyclopediaMenuItem
        v-for="child in item.children"
        :key="child.key"
        class="ml-4"
        :item="child"
      />
    </div>
  </div>
</template>

<style scoped></style>
