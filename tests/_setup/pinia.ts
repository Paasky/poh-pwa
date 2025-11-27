// tests/setup/pinia.ts
import { createPinia, setActivePinia } from 'pinia'
import { useObjectsStore } from '../../src/stores/objectStore'
import { StaticData } from '../../src/types/api'

export function initTestPinia () {
  // Create a fresh pinia for each test file
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

export function loadStaticData () {
  useObjectsStore().initStatic(
    require('../../public/staticData.json') as StaticData
  )
}
