import { Manager } from '@/managers/_manager'
import { Culture, Player } from '@/types/gameObjects'
import { CatKey } from '@/types/common'
import { TypeObject } from '@/types/typeObjects'

export class CultureManager extends Manager {
  addHeritagePoints (culture: Culture, category: CatKey, points: number): void {
    if (['mustSettle', 'settled'].includes(culture.status)) throw new Error(`[cultureManager] ${culture.key}: cannot add heritage points`)

    culture.heritageCategoryPoints[category] = (culture.heritageCategoryPoints[category] ?? 0) + points
    this.calcSelectable(culture)
  }

  calcSelectable (culture: Culture): void {
    culture.selectableTraits = []
    if (['mustSettle', 'settled'].includes(culture.status)) return

    for (const heritage of this._objects.getClassTypes('heritageType')) {
      if (culture.heritages.includes(heritage)) continue
      if ((culture.heritageCategoryPoints[heritage.category!] ?? 0) < heritage.heritagePointCost!) continue

      culture.selectableHeritages.push(heritage)
    }
  }

  evolve (culture: Culture): void {
    culture.type = this._objects.getTypeObject(culture.type.upgradesTo[0])
    const player = this._objects.getGameObject(culture.player) as Player
    player.leader = this._objects.getTypeObject(
      culture.type.allows.find(a => a.indexOf('LeaderType:') >= 0)!
    )

    this._events.turnEvents.push({
      type: 'cultureEvolved',
      target: culture.key,
      description: `${culture.name} has evolved to ${culture.type.name}!`,
    })
  }

  selectHeritage (culture: Culture, heritage: TypeObject): void {
    if (culture.heritages.includes(heritage)) throw new Error(`[cultureManager] ${culture.key}: ${heritage.key} already selected`)
    if (!culture.selectableHeritages.includes(heritage)) throw new Error(`[cultureManager] ${culture.key}: ${heritage.name} not selectable`)

    culture.heritages.push(heritage)
    this.calcSelectable(culture)
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
  }

  settle (culture: Culture): void {
    if (culture.status === 'settled') throw new Error(`[cultureManager] ${culture.key}: already settled`)

    culture.status = 'settled'
    this.calcSelectable(culture)
    this._events.turnEvents.push({
      type: 'settled',
      target: culture.player,
      description: `${culture.name} has settled their first city!`,
    })
  }
}