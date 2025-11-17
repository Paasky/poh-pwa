import { defineStore } from 'pinia'
import { TypeKey } from '@/types/common'

export type TabName =
  'Economy'
  | 'Research'
  | 'Culture'
  | 'Religion'
  | 'Diplomacy'
  | 'Cities'
  | 'Military'
  | 'Trade'
  | 'Government'
export const tabsConfig = [
  {
    name: 'Economy',
    type: 'yieldType:gold',
  },
  {
    name: 'Research',
    type: 'yieldType:science',
  },
  {
    name: 'Culture',
    type: 'yieldType:culture',
  },
  {
    name: 'Religion',
    type: 'yieldType:faith',
  },
  {
    name: 'Diplomacy',
    type: 'yieldType:influence',
  },
  {
    name: 'Cities',
    type: 'conceptType:city',
  },
  {
    name: 'Military',
    type: 'yieldType:defense',
  },
  {
    name: 'Trade',
    type: 'conceptType:tradeRoute',
  },
  {
    name: 'Government',
    type: 'conceptType:policy',
  },
] as { name: TabName, type: TypeKey }[]

export const usePlayerDetailsStore = defineStore('playerDetails', {
  state: () => ({
    isOpen: false as boolean,
    activeTab: 'Economy' as TabName,
  }),
  actions: {
    open (tab?: TabName) {
      if (tab) this.activeTab = tab
      this.isOpen = true
    },
    close () {
      this.isOpen = false
    },
    switchTab (tab: TabName) {
      this.activeTab = tab
    },
  }
})
