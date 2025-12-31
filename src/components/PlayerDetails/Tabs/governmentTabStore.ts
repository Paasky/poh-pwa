import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useDataBucket } from "@/Data/useDataBucket";
import { CatData } from "@/Common/Objects/TypeObject";
import { CatKey } from "@/Common/Objects/Common";
import { useCurrentContext } from "@/composables/useCurrentContext";

export const useGovernmentTabStore = defineStore("governmentTabStore", () => {
  const bucket = useDataBucket();
  const initialized = ref(false);

  // Static per-session data (categories & types don't change)
  const policyCats = ref<Map<CatKey, CatData>>(new Map());

  // Pointers to current player's government selections
  const government = computed(() => useCurrentContext().currentPlayer.government);

  function init() {
    if (initialized.value) return;
    policyCats.value = bucket.getClassTypesPerCategory("policyType");

    // Warm up computed values
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    government;

    initialized.value = true;
  }

  return { initialized, policyCats, government, init };
});
