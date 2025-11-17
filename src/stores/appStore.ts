import { defineStore } from 'pinia'
import { useObjectsStore } from '@/stores/objectStore'
import { useEncyclopediaStore } from '@/components/Encyclopedia/encyclopediaStore'
import { GameData, StaticData } from '@/types/api'

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
    async init (gameDataUrl?: string) {
      if (this.ready) throw new Error('App already initialized')

      // Wait 1s to simulate loading data from the server
      await new Promise(resolve => setTimeout(resolve, 1000))

      useObjectsStore().init(
        await fetchJSON<StaticData>('/staticData.json'),
        gameDataUrl ? await fetchJSON<GameData>(gameDataUrl) : undefined
      )

      // Build encyclopedia menu once after types are ready
      const encyclopedia = useEncyclopediaStore()
      encyclopedia.init()

      this.ready = true
      console.log('App initialized')
    }
  }
})
