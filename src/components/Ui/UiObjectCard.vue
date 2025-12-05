<script setup lang="ts">
import UiButton from '@/components/Ui/UiButton.vue'
import UiYields from '@/components/Ui/UiYields.vue'
import UiObjectChip from '@/components/Ui/UiObjectChip.vue'
import UiObjectChips from '@/components/Ui/UiObjectChips.vue'
import { TypeObject } from '@/types/typeObjects'

defineProps<{
  type: TypeObject;
  canSelect?: boolean;
  isSelected?: boolean;
}>()
</script>

<template>
  <v-card
      class="h-100 d-flex flex-column ga-2 my-2"
      :variant="canSelect ? 'outlined' : 'text'"
      :color="canSelect ? 'primary' : 'disabled'"
      style="border-radius: 0.5rem"
      :style="!canSelect && !isSelected ? 'opacity: 0.75' : ''"
  >
    <!-- Header with Type & Select-btn -->
    <div class="d-flex w-100 ga-2">
      <UiObjectChip
          :type="type"
          color="secondary"
          size="lg"
          style="flex: 1 1 0; text-transform: none"
      />
      <UiButton
          :variant="isSelected ? 'elevated' : canSelect ? 'outlined' : 'text'"
          :text="isSelected && canSelect
            ? 'Selected'
            : isSelected
              ? 'Locked'
              : canSelect
                ? 'Select'
                : 'Not Available'"
          style="flex: 1 1 0"
          :aria-disabled="!canSelect"
      />
    </div>

    <!-- Yields listed 1 per row -->
    <div class="d-flex flex-column ga-1">
      <UiYields :yields="type.yields"/>
    </div>

    <!-- Specials attach to bottom of card -->
    <v-spacer/>
    <div class="d-flex w-100 ga-1">
      <UiObjectChips :types="type.specials" single-row/>
    </div>
  </v-card>
</template>

<style scoped>

</style>