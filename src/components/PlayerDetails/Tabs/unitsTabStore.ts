import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useObjectsStore } from "@/stores/objectStore";
import type { Unit } from "@/objects/game/Unit";
import type { UnitDesign } from "@/objects/game/UnitDesign";

export const useUnitsTabStore = defineStore("unitsTabStore", () => {
  const objStore = useObjectsStore();
  const initialized = ref(false);

  const player = computed(() => objStore.currentPlayer);
  const units = computed<Unit[]>(() => player.value.units.value as Unit[]);
  const designs = computed<UnitDesign[]>(() => player.value.designs.value as UnitDesign[]);

  // Column definitions live in component; expose data only per requirement

  function init() {
    if (initialized.value) return;
    player.value;
    units.value;
    designs.value;
    initialized.value = true;
  }

  return { initialized, player, units, designs, init };
});
