import { defineStore } from 'pinia'
import { CategoryObject, TypeObject } from '@/types/typeObjects'
import { useObjectsStore } from '@/stores/objectStore'
import { GameObject } from '@/types/gameObjects'

export interface CategoryData {
  category: CategoryObject,
  typesData: {
    type: TypeObject,
    faithRequired: number,
    canSelect: boolean
    isSelected: boolean
  }[],
}

export const usePlayerReligionStore = defineStore('religionStore', {
  state: () => ({
    mythsPerCategory: {} as Record<string, CategoryData>,
    godsPerCategory: {} as Record<string, CategoryData>,
    dogmasPerCategory: {} as Record<string, CategoryData>,
    stateReligion: null as GameObject | null,
    ready: false as boolean,
  }),
  getters: {
    canSelectAnything: (state): boolean => {
      const anyIn = (rec: Record<string, CategoryData>) => Object.values(rec).some(cat => cat.typesData.some(t => t.canSelect))
      return anyIn(state.mythsPerCategory) || anyIn(state.godsPerCategory) || anyIn(state.dogmasPerCategory)
    }
  },
  actions: {
    init () {
      const mythsPerCategory = {} as Record<string, CategoryData>
      const godsPerCategory = {} as Record<string, CategoryData>
      const dogmasPerCategory = {} as Record<string, CategoryData>

      const objects = useObjectsStore()
      for (const type of objects.getAllTypes()) {
        if (type.concept === 'conceptType:myth') {
          addTypeToCatData(type, mythsPerCategory)
          continue
        }
        if (type.concept === 'conceptType:god') {
          addTypeToCatData(type, godsPerCategory)
        }
        if (type.concept === 'conceptType:dogma') {
          addTypeToCatData(type, dogmasPerCategory)
        }
      }

      this.mythsPerCategory = mythsPerCategory
      this.godsPerCategory = godsPerCategory
      this.dogmasPerCategory = dogmasPerCategory

      this.ready = true
      console.log('Religion Store initialized')
    }
  }
})

function addTypeToCatData (type: TypeObject, typesPerCategory: Record<string, CategoryData>) {
  const catKey = type.category!
  if (typesPerCategory[catKey]) {
    typesPerCategory[catKey].typesData.push({ type, canSelect: false, isSelected: false, faithRequired: 0 })
  } else {
    typesPerCategory[catKey] = {
      category: useObjectsStore().getCategoryObject(catKey),
      typesData: [{ type, canSelect: false, isSelected: false, faithRequired: 0 }],
    }
  }
}