import { defineStore } from 'pinia'
import { TypeObject } from '@/types/typeObjects'
import { useObjectsStore } from '@/stores/objectStore'

export interface TechData {
  type: TypeObject,
  x: number,
  y: number,
  cost: number,
  researched: number,
  canResearch: boolean,
  isResearched: boolean,
  isResearching: boolean,
  queuePos: number | null,
}

export const usePlayerScienceStore = defineStore('scienceStore', {
  state: () => ({
    techs: [] as TechData[],
    eras: [] as { era: TypeObject, y: number }[],
    queue: [] as string[],
    ready: false as boolean,
  }),
  getters: {
    // Also expose the full TechData, useful for progress display
    currentResearchTech: (state): TechData | null => state.techs.find(t => t.isResearching) ?? null,
  },
  actions: {
    init () {
      const eraData = {} as Record<string, { era: TypeObject, y: number }>
      this.techs = useObjectsStore().getClassTypes('technologyType').map((tech) => {
        let cost = 0
        for (const yieldObj of tech.yields) {
          if (yieldObj.type === 'yieldType:scienceCost' && yieldObj.method === 'lump') {
            cost += yieldObj.amount
          }
        }

        if (!eraData[tech.category!]) {
          eraData[tech.category!] = {
            era: useObjectsStore().getTypeObject(tech.category!),
            y: tech.y!,
          }
        }

        return {
          type: tech,
          x: tech.x!,
          y: tech.y!,
          cost,
          researched: 0,
          canResearch: tech.y === 2,
          isResearched: tech.y === 0,
          isResearching: tech.name === 'Herbal Remedies',
          queuePos: null,
        }
      })

      // convert record to array
      this.eras = Object.values(eraData)

      this.ready = true
      console.log('Science Store initialized')
    },
    async start (tech: TypeObject) {
      const techsByKey = {} as Record<string, TechData>
      this.techs.forEach(t => {
        techsByKey[t.type.key] = t
      })

      // Find the tech to start, stop if already researched
      const target = techsByKey[tech.key]!
      if (target.isResearched) return

      // Reset Queue
      this.queue = []
      this.techs.map(t => {
        t.isResearching = false
        t.queuePos = null
      })

      const chain = {} as Record<string, TechData>
      findRequired(target, chain)
      chain[target.type.key] = target
      const required = Object.values(chain)
        // Simple sorting: go top to bottom, then left to right
        .sort((a, b) => a.y - b.y)

      const queue = []
      let pos = 0
      for (const tech of required) {
        if (pos === 0) {
          tech.isResearching = true
          tech.queuePos = pos
        } else {
          tech.queuePos = pos
        }
        queue.push(tech.type.key)
        pos++
      }
      this.queue = queue

      return

      function findRequired (tech: TechData, chain: Record<string, TechData>): void {
        tech.type.requires.forEach(reqKey => {
          if (typeof reqKey === 'string') {
            // Already added
            if (chain[reqKey]) return

            // Always required
            const required = techsByKey[reqKey]
            if (required && !required.isResearched) {
              chain[required.type.key] = required
              findRequired(required, chain)
            }
          } else {

            // Find cheapest from the "anyOf" required
            let cheapest = null as TechData | null
            reqKey.forEach(orReqKey => {
              // Already added
              if (chain[orReqKey]) {
                cheapest = null
                return
              }

              const required = techsByKey[orReqKey]
              if (!required) return

              // If any is already researched, skip
              if (required.isResearched) {
                cheapest = null
                return
              }

              if (!cheapest || required.cost - required.researched < cheapest.cost - cheapest.researched) {
                cheapest = required
              }
            })

            if (cheapest) {
              chain[cheapest.type.key] = cheapest
              findRequired(cheapest, chain)
            }
          }
        })
      }
    }
  }
})