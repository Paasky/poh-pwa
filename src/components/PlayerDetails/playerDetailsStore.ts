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
    reqSettled: true,
  },
  {
    name: 'Research',
    type: 'yieldType:science',
    reqSettled: true,
  },
  {
    name: 'Culture',
    type: 'yieldType:culture',
    reqSettled: false,
  },
  {
    name: 'Religion',
    type: 'yieldType:faith',
    reqSettled: true,
  },
  {
    name: 'Diplomacy',
    type: 'yieldType:influence',
    reqSettled: true,
  },
  {
    name: 'Cities',
    type: 'conceptType:city',
    reqSettled: true,
  },
  {
    name: 'Military',
    type: 'yieldType:defense',
    reqSettled: false,
  },
  {
    name: 'Trade',
    type: 'conceptType:tradeRoute',
    reqSettled: true,
  },
  {
    name: 'Government',
    type: 'conceptType:policy',
    reqSettled: true,
  },
] as { name: TabName, type: TypeKey, reqSettled: boolean }[]

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
