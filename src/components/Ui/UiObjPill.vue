<script setup lang="ts">
import { computed } from "vue";
import UiIcon from "@/components/Ui/UiIcon.vue";
import { useEncyclopediaStore } from "@/components/Encyclopedia/encyclopediaStore";
import { useObjectsStore } from "@/stores/objectStore";
import UiButton from "@/components/Ui/UiButton.vue";
import { ObjKey, PohObject } from "@/types/common";

const props = defineProps<{
  objOrKey: ObjKey | PohObject;
  name?: string;
  hideIcon?: boolean;
  hideName?: boolean;
  shortName?: boolean;
}>();
defineEmits<{ (e: "click", ev: MouseEvent): void }>();
const obj = computed(
  (): PohObject =>
    typeof props.objOrKey === "object"
      ? props.objOrKey
      : (useObjectsStore().get(props.objOrKey) as PohObject),
);
const tooltip = computed(() => {
  const conceptName = useObjectsStore().getTypeObject(obj.value.concept).name;
  if (props.shortName) {
    return `${obj.value.name} (${conceptName})`;
  }
  const pieces: string[] = [];
  if (props.hideName) {
    pieces.push(obj.value.name);
    pieces.push(`(${conceptName})`);
  } else {
    pieces.push(conceptName);
  }
  return pieces.join(" ");
});

function shortenWord(word: string): string {
  return word.length > 6 ? word.slice(0, 5) + "." : word;
}

const displayName = computed(() => {
  const base = props.name ?? obj.value.name;
  if (!props.shortName) return base;
  return base
    .split(/(\s+)/)
    .map((part) => (part.trim().length === 0 ? part : shortenWord(part)))
    .join("");
});
</script>

<template>
  <UiButton variant="pill" :tooltip="tooltip" @click="useEncyclopediaStore().open(obj.key)">
    <slot />
    <UiIcon v-if="!hideIcon" :icon="obj.icon" />
    <span v-if="!hideName" class="ml-1 truncate max-w-16 lg:max-w-none">{{ displayName }}</span>
  </UiButton>
</template>
