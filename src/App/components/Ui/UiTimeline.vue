<script setup lang="ts">
import { computed } from "vue";
import { useDataBucket } from "@/Data/useDataBucket";
import UiTypeChip from "@/App/components/Ui/UiTypeChip.vue";
import UiIcon from "@/App/components/Ui/UiIcon.vue";
import { TypeObject } from "@/Common/Static/Objects/TypeObject";

const props = defineProps<{
  type: TypeObject;
  horizontal?: boolean;
}>();

const timeline = computed(() => {
  if (!props.type) return [];
  return useDataBucket().links.getTimeline(props.type);
});
</script>

<template>
  <div :class="['d-flex ga-2 align-center', props.horizontal ? 'flex-row' : 'flex-column']">
    <template v-for="(t, i) in timeline" :key="t.key">
      <UiIcon
        v-if="i > 0"
        :icon="props.horizontal ? 'chevronRight' : 'chevronDown'"
        color="grey"
        size="xs"
      />
      <UiTypeChip :type="t" :size="t.key === props.type.key ? 'large' : 'x-small'" />
    </template>
  </div>
</template>

<style scoped></style>
