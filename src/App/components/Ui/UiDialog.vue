<script setup lang="ts">
import UiIcon from "@/App/components/Ui/UiIcon.vue";

const modelValue = defineModel<boolean>({ required: true });
const search = defineModel<string>("search");

defineProps<{
  title: string;
  searchable?: boolean;
  noPadding?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

function close() {
  modelValue.value = false;
  emit("close");
}
</script>

<template>
  <v-dialog v-model="modelValue" max-width="820" scrollable v-bind="$attrs">
    <v-card rounded="lg">
      <!-- Toolbar: Title, Search & Close  -->
      <v-toolbar density="comfortable" color="secondary" class="px-4">
        <v-toolbar-title class="text-h5">{{ title }}</v-toolbar-title>
        <slot name="header-append" />
        <v-text-field
          v-if="searchable"
          v-model="search"
          placeholder="Search"
          clearable
          hide-details
          density="compact"
          variant="solo"
          style="max-width: 300px"
          class="mr-4"
        >
          <template #prepend-inner>
            <UiIcon icon="search" />
          </template>
        </v-text-field>

        <v-btn icon variant="text" @click="close" class="flex-shrink-0" title="Close">
          <UiIcon icon="close" />
        </v-btn>
      </v-toolbar>

      <v-divider />

      <v-card-text :class="noPadding ? 'pa-0' : 'pa-4'">
        <slot />
      </v-card-text>

      <v-divider v-if="$slots.actions" />

      <v-card-actions v-if="$slots.actions" class="pa-4">
        <v-spacer />
        <slot name="actions" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
