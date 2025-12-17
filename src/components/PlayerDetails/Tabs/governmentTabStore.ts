import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { CatData, useObjectsStore } from "@/stores/objectStore";

export const useGovernmentTabStore = defineStore("governmentTabStore", () => {
  const objStore = useObjectsStore();
  const initialized = ref(false);

  // Static per-session data (categories & types don't change)
  const policyCats = ref<CatData[]>([]);

  // Pointers to current player's government selections
  const government = computed(() => objStore.currentPlayer.government);

  function init() {
    if (initialized.value) return;
    policyCats.value = objStore.getClassTypesPerCategory("policyType");
    government.value;
    initialized.value = true;
  }

  return { initialized, policyCats, government, init };
});
