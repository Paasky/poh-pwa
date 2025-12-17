<script setup lang="ts">
withDefaults(
  defineProps<{
    items?: unknown[];
    colCount?: number; // desired columns on lg+
  }>(),
  {
    items: () => [],
    colCount: 4,
  },
);
</script>

<template>
  <v-container fluid>
    <v-row dense>
      <v-col
        v-for="(item, index) in items"
        :key="index"
        :cols="12"
        :lg="Math.max(1, Math.floor(12 / colCount))"
      >
        <slot name="cell" :item="item" :index="index">
          <!-- Fallback rendering if no slot is provided -->
          <pre class="text-caption">{{ item }}</pre>
        </slot>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
