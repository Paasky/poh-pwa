<script setup lang="ts">
import UiButton from "@/App/components/Ui/UiButton.vue";
import UiYields from "@/App/components/Ui/UiYields.vue";
import UiTypeChip from "@/App/components/Ui/UiTypeChip.vue";
import UiObjectChips from "@/App/components/Ui/UiObjectChips.vue";
import { TypeObject } from "@/Common/Objects/TypeObject";

withDefaults(
  defineProps<{
    type: TypeObject;
    canSelect?: boolean;
    isSelected?: boolean;
    withSpacer?: boolean;
    selectPos?: "right" | "bottom" | "hidden";
    style?: string;
  }>(),
  {
    canSelect: false,
    isSelected: false,
    withSpacer: false,
    selectPos: "bottom",
    style: "",
  },
);

defineEmits(["select"]);
</script>

<template>
  <v-card
    class="d-flex flex-column ga-2 my-2"
    :variant="canSelect ? 'outlined' : 'text'"
    :color="canSelect ? 'primary' : 'disabled'"
    style="border-radius: 0.5rem"
    :style="(!canSelect && !isSelected ? 'opacity: 0.75' : '') + ';' + style"
  >
    <!-- Header with Type & Select-btn -->
    <div class="d-flex ga-2 align-center">
      <UiTypeChip
        :type="type"
        size="small"
        color="secondary"
        class="flex-grow-1"
        style="min-width: 0; text-transform: none"
      />
      <UiButton
        v-if="selectPos === 'right'"
        @click.stop="canSelect ? $emit('select') : null"
        :text="
          isSelected && canSelect
            ? 'Selected'
            : isSelected
              ? 'Locked'
              : canSelect
                ? 'Select'
                : 'Not Available'
        "
        :type="isSelected ? 'primary' : canSelect ? 'secondary' : 'text'"
        :class="(canSelect ? 'selectable text-white ' : '') + 'flex-0-0-auto'"
        style="width: 6rem; white-space: nowrap"
      />
    </div>

    <!-- Yields listed 1 per row -->
    <div v-if="!type.yields.isEmpty" class="d-flex flex-column ga-1">
      <UiYields :yields="type.yields" />
    </div>

    <div v-if="type.gains.length" class="d-flex align-center ga-1">
      Get <UiObjectChips :types="type.gains" />
    </div>

    <!-- Specials attach to bottom of card -->
    <v-spacer v-if="withSpacer" />
    <div v-if="type.specials.length" class="d-flex ga-1">
      <UiObjectChips :types="type.specials" single-row />
    </div>

    <!-- Select-btn at bottom of card -->
    <UiButton
      v-if="selectPos === 'bottom'"
      @click.stop="canSelect ? $emit('select') : null"
      :text="
        isSelected && canSelect
          ? 'Selected'
          : isSelected
            ? 'Locked'
            : canSelect
              ? 'Select'
              : 'Not Available'
      "
      :type="isSelected ? 'primary' : canSelect ? 'secondary' : 'text'"
      :class="canSelect ? 'selectable text-white ' : ''"
      style="white-space: nowrap"
    />
  </v-card>
</template>

<style scoped>
.selectable:hover {
  /*noinspection CssUnresolvedCustomProperty*/
  background-color: rgb(var(--v-theme-primary));
}
</style>
