import { defineStore } from 'pinia'
import { useObjectsStore } from '@/stores/objectStore'
import { useEncyclopediaStore } from '@/components/Encyclopedia/encyclopediaStore'
import { GameData, StaticData } from '@/types/api'
import { EngineService } from '@/components/Engine/engine'
import { WorldManager } from '@/managers/worldManager'

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
      if (this.ready) return // Happens on hot-reload

      const objects = useObjectsStore()
      objects.init(
        await fetchJSON<StaticData>('/staticData.json'),
        gameDataUrl ? await fetchJSON<GameData>(gameDataUrl) : undefined
      )

      // Build encyclopedia menu once after types are ready
      const encyclopedia = useEncyclopediaStore()
      encyclopedia.init()

      // Create a new world
      if (!gameDataUrl) new WorldManager().create()

      // Initialize the game engine
      await EngineService.init(objects.world)

      this.ready = true
      console.log(
        'App initialized',
        'static:' + Object.keys(objects._staticObjects).length,
        'game:' + Object.keys(objects._gameObjects).length,
      )
    }
  }
})
