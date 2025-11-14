import { markRaw, reactive, shallowReactive } from 'vue'
import { defineStore } from 'pinia'
import { isCategoryObject, isTypeObject, PohObject } from '@/types/common'
import { GameData, StaticData } from '@/types/api'
import { CategoryObject, initCategoryObject, initTypeObject, TypeClass, TypeObject } from '@/types/typeObjects'
import { GameObject, init } from '@/types/gameObjects'

export const useObjectsStore = defineStore('objects', {
  state: () => ({
    world: {
      id: '',
      sizeX: 0,
      sizeY: 0,
      turn: 0,
      year: 0,
    },

    // key: PohObject.key
    _gameObjects: shallowReactive<Record<string, GameObject>>({}),
    _staticObjects: {} as Readonly<Record<string, CategoryObject | TypeObject>>,

    // key: CategoryObject.key, values: Set<TypeObject.key>
    _categoryTypesIndex: new Map<string, Set<string>>(),

    // key: TypeObject.class, values: Set<TypeObject.key>
    _classTypesIndex: new Map<TypeClass, Set<string>>(),

    // key: TypeObject.class, values: Set<CategoryObject.key>
    _classCatsIndex: new Map<TypeClass, Set<string>>(),

    ready: false as boolean
  }),
  getters: {
    // Generic getter
    get: (state) => (key: string): PohObject => {
      const obj = state._staticObjects[key] ?? state._gameObjects[key]
      if (!obj) throw new Error(`[objects] Unknown key: ${key}`)
      return obj
    },

    // Specific getters

    getGameObject: (state) => (key: string): GameObject => {
      const obj = state._gameObjects[key]
      if (!obj) throw new Error(`[objects] Unknown GameObject key: ${key}`)
      return obj
    },

    getTypeObject: (state) => (key: string): TypeObject => {
      const obj = state._staticObjects[key]
      if (!obj) throw new Error(`[objects] Unknown TypeObject key: ${key}`)
      if (!isTypeObject(obj)) throw new Error(`[objects] Not a TypeObject: ${key} : ${JSON.stringify(obj)}`)
      return obj
    },

    getCategoryObject: (state) => (key: string): CategoryObject => {
      const obj = state._staticObjects[key]
      if (!obj) throw new Error(`[objects] Unknown CategoryObject key: ${key}`)

      // Allow TypeObjects (Tech uses EraType as its Category)
      if (!isCategoryObject(obj) && !isTypeObject(obj)) throw new Error(`[objects] Not a CategoryObject: ${key}`)
      return obj as CategoryObject
    },

    // Types-array getters

    getAllTypes: (state) => (): TypeObject[] => Object.values(state._staticObjects).filter(isTypeObject),

    getCategoryTypes: (state) => (catKey: string): TypeObject[] => {
      const set = state._categoryTypesIndex.get(catKey)
      if (!set) return []
      return Array.from(set).map(key => state._staticObjects[key] as TypeObject)
    },

    getClassTypes: (state) => (typeClass: TypeClass): TypeObject[] => {
      const set = state._classTypesIndex.get(typeClass)
      if (!set) return []
      return Array.from(set).map(key => state._staticObjects[key] as TypeObject)
    },

    getClassCategories: (state) => (typeClass: TypeClass): CategoryObject[] => {
      const set = state._classCatsIndex.get(typeClass)
      if (!set) return []
      return Array.from(set).map(key => state._staticObjects[key] as CategoryObject)
    }
  },

  actions: {
    init (staticData: StaticData, gameData: GameData) {
      if (this.ready) throw new Error('Objects Store already initialized')

      // 1) Initialize static objects
      const staticObjects = {} as Record<string, CategoryObject | TypeObject>
      for (const data of staticData.types) {
        staticObjects[data.key] = Object.freeze(markRaw(initTypeObject(data)))
      }
      for (const data of staticData.categories) {
        staticObjects[data.key] = Object.freeze(markRaw(initCategoryObject(data)))
      }
      this._staticObjects = Object.freeze(staticObjects)

      // 2) Initialize the world
      this.world.id = gameData.world.id
      this.world.sizeX = gameData.world.sizeX
      this.world.sizeY = gameData.world.sizeY
      this.world.turn = gameData.world.turn
      this.world.year = gameData.world.year

      // 3) Initialize game objects
      const gameObjects = {} as Record<string, GameObject>
      for (const data of gameData.objects) {
        // todo: freeze old game objects (eg dead units, ended deals, completed goals, etc)
        gameObjects[data.key] = reactive(init(data))
      }
      Object.assign(this._gameObjects, gameObjects)

      // 4) Build indexes
      for (const obj of Object.values(this._staticObjects)) {
        if (!isTypeObject(obj)) continue

        const classTypes = this._classTypesIndex.get(obj.class)
        if (classTypes) {
          classTypes.add(obj.key)
        } else {
          this._classTypesIndex.set(obj.class, new Set([obj.key]))
        }

        if (obj.category) {
          const catTypes = this._categoryTypesIndex.get(obj.category)
          if (catTypes) {
            catTypes.add(obj.key)
          } else {
            this._categoryTypesIndex.set(obj.category, new Set([obj.key]))
          }

          const classCats = this._classCatsIndex.get(obj.class)
          if (classCats) {
            classCats.add(obj.category)
          } else {
            this._classCatsIndex.set(obj.class, new Set([obj.category]))
          }
        }
      }

      this.ready = true
      console.log('Objects Store initialized')
    },

    set (obj: GameObject) {
      if (!obj.key) throw new Error('GameObject must have a key')
      if (this._gameObjects[obj.key]) throw new Error(`GameObject ${obj.key} already exists`)
      this._gameObjects[obj.key] = reactive(obj)
    },
    bulkSet (objs: GameObject[]) {
      if (!objs.length) return

      // Validate and prepare in one pass
      const incoming: Record<string, GameObject> = {}
      const errors = []
      for (const obj of objs) {
        if (!obj.key) {
          errors.push('GameObject must have a key: ' + JSON.stringify(obj))
          continue
        }
        if (this._gameObjects[obj.key] || incoming[obj.key]) {
          errors.push(`GameObject ${obj.key} already exists`)
          continue
        }
        // Keep reactivity consistent with init
        incoming[obj.key] = reactive(obj)
      }
      if (errors.length) throw new Error(errors.join('\n'))

      Object.assign(this._gameObjects, incoming)
    },
    delete (gameObjKey: string) {
      if (!this._gameObjects[gameObjKey]) throw new Error(`GameObject ${gameObjKey} does not exist`)
      delete this._gameObjects[gameObjKey]
    }
  }
})
