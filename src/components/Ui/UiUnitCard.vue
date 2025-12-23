<script setup lang="ts">
import { computed } from "vue";
import { Unit } from "@/objects/game/Unit";
import { useCurrentContext } from "@/composables/useCurrentContext";
import UiUnitIcon from "@/components/Ui/UiUnitIcon.vue";
import UiYields from "@/components/Ui/UiYields.vue";
import UiButton from "@/components/Ui/UiButton.vue";
import { Yields } from "@/objects/yield";

const props = defineProps<{
  unit: Unit;
}>();

const context = useCurrentContext();
const unitObj = props.unit;

const combatStats = computed(() => {
  return new Yields(
    unitObj.design.value.yields
      .all()
      .filter((y) =>
        ["yieldType:strength", "yieldType:range", "yieldType:attack", "yieldType:defense"].includes(
          y.type,
        ),
      ),
  );
});
</script>

<template>
  <v-sheet class="pa-2 d-flex flex-column ga-2" color="surface" width="300" rounded="lg">
    <div class="d-flex align-center ga-2">
      <UiUnitIcon :unit="unit" :size="48" />
      <div class="d-flex flex-column flex-grow-1" style="min-width: 0">
        <v-text-field
          v-model="unitObj.customName.value"
          :placeholder="unit.design.value.name"
          variant="plain"
          density="compact"
          hide-details
          class="name-input rounded px-1"
        >
          <template #append-inner>
            <v-icon icon="fa-pen" size="x-small" class="opacity-50" />
          </template>
        </v-text-field>
        <span class="text-caption opacity-70 px-1">{{ unit.player.value.name }}</span>
      </div>
    </div>

    <!-- Vitals section -->
    <UiYields
      :yields="unit.vitals.value"
      :opts="{ showProgress: true, showProgressText: true, posLumpIsNeutral: true }"
    />

    <!-- Stats section -->
    <div class="d-flex ga-1 justify-end">
      <UiYields :yields="combatStats" :opts="{ posLumpIsNeutral: true }" />
    </div>

    <div class="d-flex ga-2 mt-1">
      <UiButton
        icon="fa-location-arrow"
        text="Move"
        :color="context.actionMode.value === 'move' ? 'tertiary' : 'primary'"
        @click="context.actionMode.value = context.actionMode.value === 'move' ? undefined : 'move'"
        :disabled="unit.movement.moves.value <= 0"
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
