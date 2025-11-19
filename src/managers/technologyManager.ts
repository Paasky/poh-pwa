import { Player, Research } from '@/types/gameObjects'
import { TypeObject } from '@/types/typeObjects'
import { Manager } from '@/managers/_manager'
import { EventManager } from '@/managers/eventManager'
import { TypeKey } from '@/types/common'

export class TechnologyManager extends Manager {

  calcAvailable (research: Research): void {
    research.available = []

    for (const tech of this._objects.getClassTypes('technologyType')) {
      // Already researched -> skip
      if (research.researched.includes(tech)) continue

      // Get required techs
      const techReqs = this.getRequiredTechs(tech)

      // Nothing required -> available
      if (techReqs.length === 0) {
        research.available.push(tech)
        continue
      }

      // Check if all required techs are researched
      let allReqsResearched = true
      for (const require of techReqs) {
        if (!research.researched.includes(require)) {
          allReqsResearched = false
          break
        }
      }
      if (allReqsResearched) research.available.push(tech)
    }
  }

  complete (player: Player, tech: TypeObject): void {
    player.research.researched.push(tech)
    const prevProgress = this.getProgress(player.research, tech)
    if (prevProgress) {
      player.yieldStorage.add('yieldType:science', prevProgress)
      delete player.research.researching[tech.key]
    }

    const eventManager = new EventManager()
    eventManager.create(
      'technologyDiscovered',
      player.key,
      tech.key,
      `discovered ${tech.name}`
    )

    const techEra = this.getEra(tech)
    if (!player.research.era || this.isLaterEra(player.research.era, techEra)) {
      player.research.era = techEra
      eventManager.create(
        'eraEntered',
        player.key,
        techEra.key,
        `entered the ${techEra.name} Era`
      )
    }
  }

  getEra (tech: TypeObject): TypeObject {
    return this._objects.getTypeObject(tech.category as TypeKey)
  }

  getProgress (research: Research, tech: TypeObject) {
    return research.researching[tech.key]?.progress ?? 0
  }

  getRequiredTechs (tech: TypeObject): TypeObject[] {
    return tech.requires
      .flatMap(reqKey => Array.isArray(reqKey) ? reqKey : [reqKey])
      .map(reqKey => this._objects.getTypeObject(reqKey))
      .filter(req => req.class === 'technologyType')
  }

  isLaterEra (from: TypeObject, to: TypeObject): boolean {
    const eras = this._objects.getClassTypes('eraType')
    return eras.indexOf(from) < eras.indexOf(to)
  }

  start (research: Research, target: TypeObject) {
    if (research.researched.includes(target)) return

    const chain: TypeObject[] = []
    // Ensure captured reference exists before collectRequired runs
    const that = this
    collectRequired(target, chain)
    chain.push(target)

    // Deduplicate while preserving order
    const unique = Array.from(new Set(chain))

    // Sort top-to-bottom then left-to-right (fallback if y equal)
    unique.sort((a, b) => (a.y! - b.y!) || (a.x! - b.x!))

    research.current = unique[0] ?? null
    research.queue = unique

    function collectRequired (tech: TypeObject, acc: TypeObject[]): void {
      tech.requires.forEach(reqKey => {
        if (Array.isArray(reqKey)) {
          let cheapest: TypeObject | false | null = null
          reqKey.forEach(orReqKey => {
            if (cheapest === false) return
            const required = that._objects.getTypeObject(orReqKey)
            if (required.class !== 'technologyType' || acc.includes(required)) return
            if (research.researched.includes(required)) {
              cheapest = false
              return
            }
            if (!cheapest || required.scienceCost! - that.getProgress(research, required) < cheapest.scienceCost! - that.getProgress(research, cheapest)) {
              cheapest = required
            }
          })
          if (cheapest) {
            acc.push(cheapest)
            collectRequired(cheapest, acc)
          }
        } else {
          const required = that._objects.getTypeObject(reqKey)
          if (required.class !== 'technologyType' || research.researched.includes(required) || acc.includes(required)) return
          acc.push(required)
          collectRequired(required, acc)
        }
      })
    }
  }
}