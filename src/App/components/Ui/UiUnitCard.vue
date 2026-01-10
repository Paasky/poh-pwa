<script setup lang="ts">
import { Unit } from "@/Common/Models/Unit";
import { useCurrentContext } from "@/Common/composables/useCurrentContext";
import UiUnitIcon from "@/App/components/Ui/UiUnitIcon.vue";
import UiYields from "@/App/components/Ui/UiYields.vue";
import UiButton from "@/App/components/Ui/UiButton.vue";
import UiTypeChip from "@/App/components/Ui/UiTypeChip.vue";
import UiGameObjChip from "@/App/components/Ui/UiGameObjChip.vue";

const unit = defineModel<Unit>({ required: true });
const context = useCurrentContext();
</script>

<template>
  <v-sheet class="pa-2 d-flex flex-column ga-2" color="surface" width="300" rounded="lg">
    <div class="d-flex align-center ga-2">
      <UiUnitIcon :unit="unit" :size="48" />
      <div class="d-flex flex-column flex-grow-1" style="min-width: 0">
        <v-text-field
          v-model="unit.customName"
          :placeholder="unit.design.name"
          variant="plain"
          density="compact"
          hide-details
          class="name-input rounded px-1"
        >
          <template #append-inner>
            <UiIcon icon="edit" size="xs" class="opacity-50" />
          </template>
        </v-text-field>
        <div class="d-flex ga-1">
          <UiTypeChip :type="unit.design.platform" />
          <UiTypeChip :type="unit.design.equipment" />
          <UiGameObjChip :obj="unit.player" />
        </div>
      </div>
    </div>

    <!-- Vitals section -->
    <UiYields
      :yields="unit.vitals"
      :opts="{ showProgress: true, showProgressText: true, posLumpIsNeutral: true }"
    />

    <!-- Stats section -->
    <div class="d-flex ga-1 justify-end">
      <UiYields :yields="unit.design.yields" :opts="{ posLumpIsNeutral: true }" />
    </div>

    <div class="d-flex ga-2 mt-1">
      <UiButton
        icon="move"
        text="Move"
        :type="context.actionMode.value === 'move' ? 'warning' : 'primary'"
        @click="context.actionMode.value = context.actionMode.value === 'move' ? undefined : 'move'"
        :is-disabled="unit.movement.moves.value <= 0"
      />
      <!-- TODO: Add more actions here -->
    </div>
  </v-sheet>
</template>

<style scoped>
.name-input :deep(input) {
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  padding-top: 0;
  padding-bottom: 0;
  min-height: 0;
}
.name-input:hover {
  background-color: rgba(255, 255, 255, 0.05);
}
.name-input :deep(.v-field__append-inner) {
  padding-top: 0;
  align-items: center;
  cursor: pointer;
}
</style>
