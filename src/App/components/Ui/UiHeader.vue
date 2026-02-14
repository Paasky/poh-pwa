<script setup lang="ts">
import { useEncyclopediaStore } from "@/App/components/Encyclopedia/encyclopediaStore";
import { computed } from "vue";
import { TypeKey } from "@/Common/Static/StaticEnums";
import { TypeObject } from "@/Common/Static/Objects/TypeObject";

const props = defineProps<{
  title: string;
  type?: TypeKey | TypeObject | undefined;
}>();

const typeKey = computed((): TypeKey | undefined => {
  if (!props.type) return undefined;
  return typeof props.type === "object" ? props.type.key : props.type;
});

function onClick() {
  if (typeKey.value) {
    useEncyclopediaStore().open(typeKey.value);
  }
}
</script>

<template>
  <!-- Vuetify-based header with optional encyclopedia navigation -->
  <v-sheet
    class="text-h4 text-center pt-6 user-select-none"
    :style="{
      background: 'linear-gradient(0deg, rgba(133, 77, 14, 0) 67%, rgba(133, 77, 14, 0.5) 100%)',
    }"
    color="transparent"
    elevation="0"
  >
    <h2
      :class="typeKey ? 'd-inline-block text-yellow-darken-2 cursor-pointer' : ''"
      @click="onClick"
    >
      {{ title }}
    </h2>
  </v-sheet>
</template>
