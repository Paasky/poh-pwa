import { TypeObject } from '@/types/typeObjects'
import { TypeStorage } from '@/types/common'
import { City, GameClass, Tile, Unit } from '@/types/gameObjects'
import { useObjectsStore } from '@/stores/objects'

export class Player {
  id: string
  class: GameClass = 'player'
  key: string
  name: string
  isCurrent: boolean

  culture: Culture

  visibleTiles: Record<string, Tile> = {}
  ownedTiles: Record<string, Tile> = {}
  units: Record<string, Unit> = {}
  cities: Record<string, City> = {}

  research = {
    // Techs that have been researched
    researched: {} as Record<string, TypeObject>,

    // Techs that can be researched and progress
    researching: {} as Record<string, { type: TypeObject, researched: number }>,

    // Current tech being researched (is also i 0 in queue)
    current: null as TypeObject | null,
    queue: [] as TypeObject[],
  }

  religion = {
    id: '',
    class: '',
    key: '',
    name: '',
    status: 'myths' as 'myths' | 'gods' | 'dogmas',

    myths: {} as Record<string, TypeObject>,
    selectableMyths: {} as Record<string, TypeObject>,
    canSelectMyth: () => Object.keys(this.religion.myths).length > 0,
  }

  government = {
    turnsToElection: 0 as number,
    hasElections: false as boolean,
    forcedPolicyUnhappiness: 0 as number,
    corruptionDisorder: 0 as number,
    revolutionChance: 0 as number,
    inRevolution: false as boolean,

    policies: {} as Record<string, TypeObject>,
    selectablePolicies: {} as Record<string, TypeObject>,
    canSelectPolicy: () => Object.keys(this.government.policies).length > 0,
  }

  resourceStorage = new TypeStorage()
  stockpileStorage = new TypeStorage()
  yieldStorage = new TypeStorage()

  constructor (
    id: string,
    key: string,
    name: string,
    isCurrent: boolean,
    culture: Culture
  ) {
    this.id = id
    this.key = key
    this.name = name
    this.isCurrent = isCurrent
    this.culture = culture
  }
}

export function generatePlayer (current = true): Player {
  const id = crypto.randomUUID()
  const cultureId = crypto.randomUUID()
  const player = new Player(
    id,
    'player:' + id,
    'Paaskyyy',
    current,
    new Culture(cultureId, 'culture:' + cultureId, 'Paaskyyy Culture')
  )

  return player
}

export class Culture {
  id: string
  class: GameClass = 'culture'
  key: string
  name: string
  status: 'notSettled' | 'canSettle' | 'mustSettle' | 'settled' = 'notSettled'

  constructor (
    id: string,
    key: string,
    name: string,
    status?: 'notSettled' | 'canSettle' | 'mustSettle' | 'settled'
  ) {
    this.id = id
    this.key = key
    this.name = name
    if (status) this.status = status
  }

  heritages: Record<string, TypeObject> = {}
  private _heritagesBackup: Record<string, TypeObject> = {}
  selectableHeritages: Record<string, TypeObject> = {}

  // string is the category key, eg heritageCategory:arctic
  heritageCategoryPoints: Record<string, number> = {}

  canSelectHeritage = () => Object.keys(this.heritages).length > 0

  selectHeritage = (key: string) => {
    const heritage = this.selectableHeritages[key]
    if (!heritage) throw new Error(`Heritage ${key} not selectable`)

    this.heritages[key] = heritage

    if (Object.keys(this.heritages).length < 3) {
      // Can select more
      delete this.selectableHeritages[key]
    } else {
      // Can't select more, set status to mustSettle
      this.status = 'mustSettle'
      this.selectableHeritages = {}
      this.heritageCategoryPoints = {}
    }
  }

  backupHeritages = () => {
    this._heritagesBackup = { ...this.heritages }
  }

  resetHeritages = () => {
    this.heritages = { ...this._heritagesBackup }
  }

  addHeritageCategoryPoints = (category: string, points: number) => {
    if (['mustSettle', 'settled'].includes(this.status)) throw new Error(`Culture ${this.name} is ${this.status}, can't add heritage category points`)

    this.heritageCategoryPoints[category] = (this.heritageCategoryPoints[category] ?? 0) + points
    this._calcSelectable(category)
  }

  private _calcSelectable = (category?: string) => {
    // Can't select heritages if culture must/is settled
    if (['mustSettle', 'settled'].includes(this.status)) {
      this.selectableHeritages = {}
      return
    }

    const objects = useObjectsStore()
    if (category) {
      for (const heritage of objects.getCategoryTypes(category)) {
        // Already selectable
        if (this.selectableHeritages[heritage.id]) {
          // Already have it, remove from selectables
          if (this.heritages[heritage.id]) {
            delete this.selectableHeritages[heritage.id]
          }
          continue
        }

        // Already have it
        if (this.heritages[heritage.id]) continue

        // If has enough points, add to selectables
        const reqPoints = this._reqPoints(heritage)
        if (reqPoints > 0 && this.heritageCategoryPoints[category] >= reqPoints) {
          this.selectableHeritages[heritage.id] = heritage
        }
      }
    } else {
      // No category: reset selectables and recalculate
      this.selectableHeritages = {}
      for (const catObject of objects.getClassCategories('heritageType')) {
        if (catObject.class === 'heritageCategory') {
          this._calcSelectable(catObject.id)
        }
      }
    }
  }

  private _reqPoints = (heritage: TypeObject): number => {
    // Already have it
    if (this.heritages[heritage.id]) return 0

    // Ends in II -> must have the 1st one
    if (heritage.id.endsWith('II')) {
      const idI = heritage.id.substring(0, -1)
      return this.heritages[idI] ? 25 : 0
    }

    return 10
  }

  traits: Record<string, TypeObject> = {}
  selectableTraits: Record<string, TypeObject> = {}
  mustSelect = { positive: 0, negative: 0 }
  canSelectTrait = () => Object.keys(this.traits).length > 0
}
