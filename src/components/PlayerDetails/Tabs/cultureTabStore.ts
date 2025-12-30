import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { CatData, useDataBucket } from "@/Data/useDataBucket";

export const useCultureTabStore = defineStore("cultureTabStore", () => {
  const bucket = useDataBucket();
  const initialized = ref(false);

  const heritageCats = ref<CatData[]>([]);
  const traitCats = ref<CatData[]>([]);

  const culture = computed(() => useCurrentContext().currentPlayer.culture.value);

  function init() {
    if (initialized.value) return;
    heritageCats.value = bucket.getClassTypesPerCategory("heritageType");
    traitCats.value = bucket.getClassTypesPerCategory("traitType");

    // Warm up computed values
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    culture;

    initialized.value = true;
  }

  return { initialized, heritageCats, traitCats, culture, init };
});
