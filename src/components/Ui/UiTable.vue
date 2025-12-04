<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, ref, useAttrs } from "vue";

export type TableAlign = "start" | "center" | "end";
export type TableColumn<T> = {
  title: string;
  key: string; // VDataTable column key
  align?: TableAlign; // affects header title alignment
  value?: (item: T) => any; // optional cell extractor for simple cells
};

const props = withDefaults(
  defineProps<{
    items: unknown[];
    columns: TableColumn<any>[];
    itemKey?: string;
    hover?: boolean; // optional explicit hover control
    // New optional title for the table header
    title?: string;
    // Show the (filtered/total) count next to the title
    showCount?: boolean;
    // Optional custom search predicate to filter items with the search box
    search?: (item: any, term: string) => boolean;
  }>(),
  {
    itemKey: 'key',
    hover: false,
    showCount: true,
  },
);

// Normalize headers to always provide a value extractor, so simple cells render automatically
const normalizedHeaders = computed(() =>
  props.columns.map((h) => ({
    ...h,
    value:
      h.value ||
      ((item: unknown) => {
        // basic fallback: property lookup by key
        return (item as Record<string, unknown>)[h.key];
      }),
  })),
);

const attrs = useAttrs();

// local search term for the built-in search box
// Note: Vuetify clearable text field can emit null on clear; we guard against it.
const searchTerm = ref("");

// When a search predicate is provided, filter locally; otherwise, return items unchanged
const filteredItems = computed(() => {
  const term = (searchTerm.value ?? "").toString().trim();
  if (!term || typeof props.search !== "function") return props.items;
  // filter using the provided predicate
  return props.items.filter((item) => props.search!(item, term));
});
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-2 w-100 ga-4">
      <h4 v-if="title" class="text-h6">
        {{ title }}
        <span v-if="showCount">
          ({{ ((searchTerm ?? '').toString().trim()) ? `${filteredItems.length}/${items.length}` : items.length }})
        </span>
      </h4>
      <v-text-field
        v-if="typeof search === 'function'"
        v-model="searchTerm"
        density="compact"
        hide-details
        clearable
        @click:clear="searchTerm = ''"
        variant="outlined"
        label="Search"
        prepend-inner-icon="fa-magnifying-glass"
        style="max-width: 16.25rem"
      />
    </div>
    <v-data-table
      :headers="normalizedHeaders"
      :items="filteredItems"
      :item-key="itemKey"
      density="compact"
      hide-default-footer
      :hover="hover"
      v-bind="attrs"
      class="w-100"
    >
      <template v-for="col in columns" #[`header.${col.key}`]="slotProps" :key="`h-${col.key}`">
        <slot :name="`header.${col.key}`" v-bind="slotProps">
          <h6
            :class="[
              'text-h6',
              col.align === 'end' ? 'text-right' : col.align === 'center' ? 'text-center' : '',
            ]"
          >
            {{ slotProps.column.title }}
          </h6>
        </slot>
      </template>
      <template v-for="col in columns" #[`item.${col.key}`]="slotProps" :key="`i-${col.key}`">
        <slot :name="`item.${col.key}`" v-bind="slotProps">
          {{ col.value ? col.value(slotProps.item) : (slotProps.item as any)[col.key] }}
        </slot>
      </template>
    </v-data-table>
  </div>
</template>

<style scoped></style>
