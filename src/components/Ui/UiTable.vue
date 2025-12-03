<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, useAttrs } from "vue";

export type TableAlign = "start" | "center" | "end";
export type TableColumn<T> = {
  title: string;
  key: string; // VDataTable column key
  align?: TableAlign; // affects header title alignment
  value?: (item: T) => any; // optional cell extractor for simple cells
  search?: (item: T, term: string) => boolean;
};

const props = defineProps<{
  items: unknown[];
  columns: TableColumn<any>[];
  itemKey?: string;
  hover?: boolean; // optional explicit hover control
}>();

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
</script>

<template>
  <v-data-table
    :headers="normalizedHeaders"
    :items="items"
    :item-key="itemKey ?? 'key'"
    density="compact"
    hide-default-footer
    :hover="props.hover"
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
</template>

<style scoped></style>
