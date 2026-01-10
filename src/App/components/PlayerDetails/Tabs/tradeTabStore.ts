import { defineStore } from "pinia";
import { ref } from "vue";

export const useTradeTabStore = defineStore("tradeTabStore", () => {
  const initialized = ref(false);

  function init() {
    if (initialized.value) return;
    initialized.value = true;
  }

  return { initialized, init };
});
