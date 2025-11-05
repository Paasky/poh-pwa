import { defineStore } from 'pinia'
import { useObjectsStore } from '@/stores/objects'
import { useEncyclopediaStore } from '@/components/Encyclopedia/store'
import { GameData, SaveData } from '@/types/api'
import { usePlayerScienceStore } from '@/components/PlayerDetails/Tabs/scienceStore'
import { usePlayerFaithStore } from '@/components/PlayerDetails/Tabs/faithStore'
import { usePlayerGovernmentStore } from '@/components/PlayerDetails/Tabs/governmentStore'
import { usePlayersStore } from '@/stores/players'

async function fetchJSON<T> (url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`)
  return await res.json() as Promise<T>
}

export const useAppStore = defineStore('app', {
  state: () => ({
    ready: false,
    isProcessing: false,
  }),
  actions: {
    async init (force = false) {
      if (this.ready && !force) return

      // Wait 1s to simulate loading data from the server
      await new Promise(resolve => setTimeout(resolve, 1000))

      const [gameData, saveData] = await Promise.all([
        fetchJSON<GameData>('/gameData.json'),
        fetchJSON<SaveData>('/saveData.json')
      ])

      useObjectsStore().init(gameData, saveData.objects)

      usePlayersStore().init()

      usePlayerFaithStore().init()
      usePlayerGovernmentStore().init()
      usePlayerScienceStore().init()

      // Build encyclopedia menu once after types are ready
      const encyclopedia = useEncyclopediaStore()
      encyclopedia.init()

      this.ready = true
      console.log('App initialized')
    }
  }
})
