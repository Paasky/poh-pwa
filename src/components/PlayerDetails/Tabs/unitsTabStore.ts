/* eslint-disable @typescript-eslint/no-unused-expressions */
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useObjectsStore } from "@/stores/objectStore";
import type { Unit } from "@/Common/Models/Unit";
import type { UnitDesign } from "@/Common/Models/UnitDesign";

export const useUnitsTabStore = defineStore("unitsTabStore", () => {
  const objStore = useObjectsStore();
  const initialized = ref(false);

  const player = computed(() => objStore.currentPlayer);
  const units = computed<Unit[]>(() => player.value.units as Unit[]);
  const designs = computed<UnitDesign[]>(() => player.value.designs.value as UnitDesign[]);

  // Column definitions live in component; expose data only per requirement

  function init() {
    if (initialized.value) return;

    player;
    units;
    designs;

    initialized.value = true;
  }

  return { initialized, player, units, designs, init };
});
