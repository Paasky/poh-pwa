import { defineStore } from 'pinia'
import { CategoryObject, TypeObject } from '@/types/typeObjects'
import { useObjectsStore } from '@/stores/objectStore'

export interface CategoryData {
  category: CategoryObject,
  typesData: {
    type: TypeObject,
    canSelect: boolean
    isSelected: boolean
  }[],
}

export const usePlayerGovernmentStore = defineStore('governmentStore', {
  state: () => ({
    policiesPerCategory: {} as Record<string, CategoryData>,
    turnsToElection: 0 as number,
    hasElections: false as boolean,
    forcedPolicyUnhappiness: 0 as number,
    corruptionDisorder: 0 as number,
    revolutionChance: 0 as number,
    inRevolution: false as boolean,
    ready: false as boolean,
  }),
  actions: {
    init () {
      const policiesPerCategory = {} as Record<string, CategoryData>

      const objects = useObjectsStore()
      for (const type of objects.getClassTypes('policyType')) {
        addTypeToCatData(type, policiesPerCategory)
      }

      this.policiesPerCategory = policiesPerCategory
      this.ready = true
      console.log('Government Store initialized')
    }
  }
})

function addTypeToCatData (type: TypeObject, typesPerCategory: Record<string, CategoryData>) {
  const catKey = type.category!
  if (typesPerCategory[catKey]) {
    typesPerCategory[catKey].typesData.push({ type, canSelect: false, isSelected: false })
  } else {
    typesPerCategory[catKey] = {
      category: useObjectsStore().getCategoryObject(catKey),
      typesData: [{ type, canSelect: false, isSelected: false }],
    }
  }
}