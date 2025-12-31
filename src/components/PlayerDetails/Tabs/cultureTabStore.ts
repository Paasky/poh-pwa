import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useDataBucket } from "@/Data/useDataBucket";
import { useCurrentContext } from "@/composables/useCurrentContext";
import { CatData } from "@/Common/Objects/TypeObject";
import { CatKey } from "@/Common/Objects/Common";

export const useCultureTabStore = defineStore("cultureTabStore", () => {
  const bucket = useDataBucket();
  const initialized = ref(false);

  const heritageCats = ref<Map<CatKey, CatData>>(new Map());
  const traitCats = ref<Map<CatKey, CatData>>(new Map());

  const culture = computed(() => useCurrentContext().currentPlayer.culture);

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
