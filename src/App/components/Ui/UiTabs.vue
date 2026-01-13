<script setup lang="ts">
import type { IconKey } from "@/Common/Static/Icon";
import UiButton from "@/App/components/Ui/UiButton.vue";

const modelValue = defineModel<string | number>();

defineProps<{
  items: {
    label: string;
    value: string | number;
    icon?: IconKey;
  }[];
}>();
</script>

<template>
  <div>
    <div class="d-flex ga-1">
      <UiButton
        v-for="item in items"
        :key="item.value"
        :type="modelValue === item.value ? 'primary' : 'secondary'"
        :icon="item.icon"
        :text="item.label"
        rounded="t-lg b-0"
        size="large"
        height="40"
        @click="modelValue = item.value"
      />
    </div>
    <v-divider />
  </div>
</template>

<style scoped></style>
