import { defineStore } from 'pinia'

export type TabKey =
  | 'gold'
  | 'science'
  | 'culture'
  | 'faith'
  | 'influence'
  | 'cities'
  | 'military'
  | 'trade'
  | 'government'

export const ALL_TABS: readonly TabKey[] = [
  'gold',
  'science',
  'culture',
  'faith',
  'influence',
  'cities',
  'military',
  'trade',
  'government'
] as const

export const usePlayerDetailsStore = defineStore('playerDetails', {
  state: () => ({
    isOpen: false as boolean,
    activeTab: 'gold' as TabKey,
    // Placeholder for per-tab persistent states (kept even when tab is not active)
    tabState: {} as Record<TabKey, unknown>
  }),
  actions: {
    open (tab?: TabKey) {
      if (tab) this.activeTab = tab
      this.isOpen = true
    },
    close () {
      this.isOpen = false
    },
    switchTab (tab: TabKey) {
      this.activeTab = tab
    },
    setTabState<T = unknown> (tab: TabKey, value: T) {
      this.tabState[tab] = value as unknown
    }
  }
})
