import { ObjKey } from '@/types/common'
import {
  Agenda,
  Citizen,
  City,
  Construction,
  Culture,
  Deal,
  GameClass,
  GameKey,
  GameObjAttr,
  GameObject,
  Player,
  Religion,
  Tile,
  TradeRoute,
  Unit,
  UnitDesign
} from '@/objects/gameObjects'
import { CategoryObject, TypeObject } from '@/types/typeObjects'
import { GameData } from '@/types/api'

// Constructor type that also exposes the static attrsConf declared on each GameObject subclass
type Ctor<T = GameObject> = {
  new (...args: any[]): T
  attrsConf: GameObjAttr[]
}

const classConf = {
  'agenda': Agenda,
  'citizen': Citizen,
  'city': City,
  'construction': Construction,
  'culture': Culture,
  'deal': Deal,
  'player': Player,
  'religion': Religion,
  'tile': Tile,
  'tradeRoute': TradeRoute,
  'unit': Unit,
  'unitDesign': UnitDesign,
} as Record<GameClass, Ctor>

type SimpleObjStore = {
  get (key: ObjKey): CategoryObject | GameObject | TypeObject
  bulkSet (objs: GameObject[]): void
}

export class GameDataLoader {
  private _objStore: SimpleObjStore

  constructor (objStore: SimpleObjStore) {
    this._objStore = objStore
  }

  load (gameData: GameData): GameObject[] {
    const objs = [] as GameObject[]

    // Init each object
    for (const rawObjData of gameData.objects) {
      const objClass = rawObjData.class as GameClass
      if (!objClass) {
        throw new Error(`Invalid game obj data: class is missing from ${JSON.stringify(rawObjData)}`)
      }
      const config = classConf[objClass]
      if (!config) {
        throw new Error(`Invalid initConf: undefined class '${objClass}'`)
      }
      objs.push(this._initObj(rawObjData, config))
    }

    this._objStore.bulkSet(objs)

    // Post-process each object (build backward-relations)
    for (const obj of objs) {
      this._postProcessAttrs(obj)
    }

    return objs
  }

  private _initObj (rawObjData: any, ctor: Ctor): GameObject {
    const attrs = {} as Record<string, any>
    for (const attrConf of ctor.attrsConf) {
      attrs[attrConf.attrName] = this._initAttr(rawObjData, attrConf)
    }
    return new ctor(rawObjData.key, attrs)
  }

  private _initAttr (rawObjData: any, config: GameObjAttr): any {
    const data = rawObjData[config.attrName]
    if (data === undefined) {
      if (!config.isOptional) throw new Error(
        `Required attribute '${config.attrName}' missing from ${JSON.stringify(rawObjData)}`
      )
      return undefined
    }

    if (config.isTypeObj) {
      return this._objStore.get(data)
    }
    if (config.isTypeObjArray) {
      return data.map((d: GameKey) => this._objStore.get(d))
    }

    return data
  }

  private _postProcessAttrs (obj: GameObject): void {
    const ctor = (obj.constructor as unknown as { attrsConf: GameObjAttr[] })
    for (const attrConf of ctor.attrsConf) {
      if (!attrConf.related) {
        continue
      }
      const data = (obj as any)[attrConf.attrName]
      if (data === undefined) {
        if (!attrConf.isOptional) throw new Error(
          `Required attribute '${attrConf.attrName}' missing from ${JSON.stringify(obj)}`
        )
        continue
      }

      const related = this._objStore.get(data)
      if (attrConf.related.isOne) {
        (related as any)[attrConf.related.theirKeyAttr] = obj.key
      } else {
        (related as any)[attrConf.related.theirKeyAttr].push(obj.key)
      }
    }
  }
}