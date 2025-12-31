<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue: string | number | boolean | null;
  items: string[] | { title: string; value: string | number | boolean | null }[];
  label?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number | boolean | null): void;
}>();

const normalizedItems = computed(() => {
  return props.items.map((item) => {
    if (typeof item === "string") {
      return { title: item, value: item };
    }
    return item;
  });
});

function select(value: string | number | boolean | null) {
  emit("update:modelValue", value);
}
</script>

<template>
  <div class="ui-radio-buttons-container">
    <div v-if="label" class="text-subtitle-1 mb-2">{{ label }}</div>
    <div class="ui-radio-buttons">
      <button
        v-for="item in normalizedItems"
        :key="item.value"
        class="ui-radio-button"
        :class="{ 'is-selected': modelValue === item.value }"
        @click="select(item.value)"
      >
        {{ item.title }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ui-radio-buttons {
  display: flex;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
}

.ui-radio-button {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  text-align: center;
}

.ui-radio-button:hover:not(.is-selected) {
  background-color: rgba(255, 255, 255, 0.05);
}

.ui-radio-button.is-selected {
  background-color: white;
  color: #212121; /* dark background equivalent */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
