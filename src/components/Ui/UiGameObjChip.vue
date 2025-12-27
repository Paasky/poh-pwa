<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed } from "vue";
import { GameObject } from "@/objects/game/_GameObject";
import { useCurrentContext } from "@/composables/useCurrentContext";

const props = defineProps<{ obj: GameObject; size?: string }>();

const name = computed(() => {
  const n = (props.obj as any).name;
  return n?.value ?? n ?? props.obj.key;
});

const color = computed(() => (props.obj as any).player?.value?.color ?? "secondary");

function select() {
  const current = useCurrentContext();
  current.object.value = props.obj as any;
  if ("tile" in props.obj) {
    // If it has a tile (like Unit or City), select it too
    current.tile.value = (props.obj as any).tile;
  }
}
</script>

<template>
  <v-btn
    :color="color"
    rounded="xl"
    :size="props.size ?? 'x-small'"
    variant="elevated"
    @click.stop="select"
  >
    {{ name }}
  </v-btn>
</template>

<style scoped></style>
