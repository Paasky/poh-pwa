import { Manager } from '@/managers/_manager'
import { Culture, Player } from '@/objects/game/gameObjects'
import { CatKey, TypeKey } from '@/types/common'
import { TypeObject } from '@/types/typeObjects'
import { EventManager } from '@/managers/eventManager'
import { TechnologyManager } from '@/managers/technologyManager'
import { Yields } from '@/objects/yield'

export class CultureManager extends Manager {
  addHeritagePoints (culture: Culture, category: CatKey, points: number): void {
    if (['mustSettle', 'settled'].includes(culture.status)) throw new Error(`[cultureManager] ${culture.key}: cannot add heritage points`)

    culture.heritageCategoryPoints[category] = (culture.heritageCategoryPoints[category] ?? 0) + points
    this.calcSelectable(culture)
  }

  calcSelectable (culture: Culture): void {
    culture.selectableHeritages = []
    culture.selectableTraits = []

    // Must settle -> can't select anything
    if (culture.status === 'mustSettle') return

    // Not settled -> can select heritages
    if (['notSettled', 'canSettle'].includes(culture.status)) {
      for (const catData of this._objects.getClassTypesPerCategory('heritageType')) {
        let catIsSelected = false
        for (const heritage of catData.types) {
          if (culture.heritages.includes(heritage)) catIsSelected = true
        }

        for (const heritage of catData.types) {
          // Already selected
          if (culture.heritages.includes(heritage)) continue

          // If it's stage II -> must have stage I heritage selected
          if (heritage.heritagePointCost! > 10 && !catIsSelected) continue

          // Not enough points
          if ((culture.heritageCategoryPoints[heritage.category!] ?? 0) < heritage.heritagePointCost!) continue

          culture.selectableHeritages.push(heritage)
        }
      }
      return
    }

    // Is Settled -> can select Traits

    // Nothing to select?
    if (culture.mustSelectTraits.positive + culture.mustSelectTraits.negative <= 0) return

    for (const catData of this._objects.getClassTypesPerCategory('traitType')) {
      let catIsSelected = false
      for (const trait of catData.types) {
        if (culture.traits.includes(trait)) catIsSelected = true
      }

      for (const trait of catData.types) {
        // Category already selected
        if (catIsSelected) continue

        // No more positive/negative slots left to select
        if (trait.isPositive! && culture.mustSelectTraits.positive <= 0) continue
        if (!trait.isPositive! && culture.mustSelectTraits.negative <= 0) continue

        culture.selectableTraits.push(trait)
      }
    }
  }

  calcStatic (culture: Culture): void {
    culture.yields = new Yields([
      ...culture.heritages.flatMap(heritage => heritage.yields.all()),
      ...culture.traits.flatMap(trait => trait.yields.all()),
    ])
  }

  evolve (culture: Culture): void {
    culture.type = this._objects.getTypeObject(culture.type.upgradesTo[0])
    const player = this._objects.getGameObject(culture.player) as Player
    player.leader = this.getLeader(culture.type)

    if (culture.traits.length < 11) {
      culture.mustSelectTraits.positive++
      culture.mustSelectTraits.negative++
      this.calcSelectable(culture)
    }

    new EventManager().create(
      'cultureEvolved',
      player.key,
      culture.key,
      `evolved to the ${culture.type.name} culture`,
    )
  }

  getLeader (cultureType: TypeObject): TypeObject {
    const key = cultureType.allows?.find(a => a.indexOf('LeaderType:') >= 0)
    if (!key) throw new Error(`[cultureManager] No LeaderType in ${JSON.stringify(cultureType)}`)

    return this._objects.getTypeObject(key)
  }

  getMajorTypeForRegion (region: TypeObject, evolution: 0 | 1 | 2 | 3 | 4 = 0): TypeObject {
    const key = region.allows?.find(a => a.startsWith('majorCultureType:'))
    if (!key) throw new Error(`[cultureManager] No majorCultureType in ${JSON.stringify(region)}`)

    return this._objects.getTypeObject(key)
  }

  getMinorTypeForRegion (region: TypeObject, group: 0 | 1 = 0, evolution: 0 | 1 = 0): TypeObject {
    const i = group * 2 + evolution
    const key = region.allows?.filter(a => a.startsWith('minorCultureType:'))[i] ?? null
    if (!key) throw new Error(`[cultureManager] No minorCultureType[${i}] in ${JSON.stringify(region)}`)

    return this._objects.getTypeObject(key)
  }

  getRegion (cultureType: TypeObject): TypeObject {
    const key = cultureType.requires!.filter(['regionType']).allTypes[0] as TypeKey
    return this._objects.getTypeObject(key)
  }

  selectHeritage (culture: Culture, heritage: TypeObject): void {
    if (culture.heritages.includes(heritage)) throw new Error(`[cultureManager] ${culture.key}: ${heritage.key} already selected`)
    if (!culture.selectableHeritages.includes(heritage)) throw new Error(`[cultureManager] ${culture.key}: ${heritage.name} not selectable`)

    culture.heritages.push(heritage)
    if (culture.heritages.length === 2) {
      culture.status = 'canSettle'
    }
    if (culture.heritages.length > 2) {
      culture.status = 'mustSettle'
    }
    for (const gainKey of heritage.gains) {
      const player = this._objects.getGameObject(culture.player) as Player
      const gain = this._objects.getTypeObject(gainKey)
      if (gain.class === 'technologyType') {
        new TechnologyManager().complete(player, gain)
      }
    }
    this.calcSelectable(culture)
    this.calcStatic(culture)
  }

  selectTrait (culture: Culture, trait: TypeObject): void {
    if (culture.traits.includes(trait)) throw new Error(`[cultureManager] ${culture.key}: ${trait.key} already selected`)
    if (!culture.selectableTraits.includes(trait)) throw new Error(`[cultureManager] ${culture.key}: ${trait.name} not selectable`)

    culture.traits.push(trait)
    if (trait.isPositive!) {
      culture.mustSelectTraits.positive--
    } else {
      culture.mustSelectTraits.negative--
    }

    this.calcSelectable(culture)
    this.calcStatic(culture)
  }

  settle (culture: Culture): void {
    if (culture.status === 'settled') throw new Error(`[cultureManager] ${culture.key}: already settled`)

    culture.status = 'settled'
    culture.mustSelectTraits = { positive: 2, negative: 2 }
    this.calcSelectable(culture)
    new EventManager().create(
      'settled',
      culture.player,
      culture.key,
      `settled down`
    )
  }
}