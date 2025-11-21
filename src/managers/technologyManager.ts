import { Player, Research } from '@/types/gameObjects'
import { TypeObject } from '@/types/typeObjects'
import { Manager } from '@/managers/_manager'
import { EventManager } from '@/managers/eventManager'
import { TypeKey } from '@/types/common'

export class TechnologyManager extends Manager {
  complete (player: Player, tech: TypeObject): void {
    if (player.research.researched.includes(tech)) throw new Error(`[technologyManager] ${player.key}: ${tech.key} already researched`)

    player.research.researched.push(tech)
    delete player.research.researching[tech.key]

    // Process research queue
    if (player.research.current === tech) player.research.current = null
    player.research.queue = player.research.queue.filter(t => t !== tech)
    if (player.research.queue.length > 0) player.research.current = player.research.queue[0]

    // Add available types
    for (const allowsKey of tech.allows) {
      const allows = this._objects.getTypeObject(allowsKey)
      if (allows.class !== 'technologyType') player.knownTypes.push(this._objects.getTypeObject(allowsKey))
    }

    // Add a unit design point
    player.yieldStorage.add('yieldType:designPoints', 1)

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