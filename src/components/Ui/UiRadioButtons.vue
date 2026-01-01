<script setup lang="ts">
import { computed } from "vue";
import UiButton from "@/components/Ui/UiButton.vue";

const modelValue = defineModel<string | number | boolean | null>({ required: true });
const props = defineProps<{
  items: string[] | { title: string; value: string | number | boolean | null }[];
  label?: string;
}>();

const normalizedItems = computed(() => {
  return props.items.map((item) => {
    if (typeof item === "string") {
      return { title: item, value: item };
    }
    return item;
  });
});
</script>

<template>
  <v-item-group v-model="modelValue" mandatory class="ui-radio-buttons">
    <v-item v-for="item in normalizedItems" :key="String(item.value)" :value="item.value">
      <template #default="{ isSelected, toggle }">
        <UiButton
          :type="isSelected ? 'primary' : 'secondary'"
          class="flex-grow-1"
          :text="item.title"
          is-block
          size="default"
          @click="toggle"
        />
      </template>
    </v-item>
  </v-item-group>
</template>

<style scoped>
.ui-radio-buttons {
  display: flex;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
}
</style>
