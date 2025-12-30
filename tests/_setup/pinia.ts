// tests/setup/pinia.ts
import { createPinia, setActivePinia } from "pinia";
import { useDataBucket } from "../../src/Data/useDataBucket";
import { StaticData } from "../../src/types/api";
import staticData from "../../public/staticData.json";

export function initTestPinia() {
  // Create a fresh pinia for each test file
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

export function loadStaticData() {
  useDataBucket().initStatic(staticData as StaticData);
}
