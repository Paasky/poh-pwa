/* eslint-disable @typescript-eslint/no-unused-expressions */
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { Unit } from "@/Common/Models/Unit";
import type { UnitDesign } from "@/Common/Models/UnitDesign";
import { useCurrentContext } from "@/composables/useCurrentContext";

export const useUnitsTabStore = defineStore("unitsTabStore", () => {
  const initialized = ref(false);

  const player = computed(() => useCurrentContext().currentPlayer);
  const units = computed<Unit[]>(() => player.value.units as Unit[]);
  const designs = computed<UnitDesign[]>(() => player.value.designs as UnitDesign[]);

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
