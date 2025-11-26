import { markRaw } from 'vue'
import { defineStore } from 'pinia'
import { CatKey, isCategoryObject, isTypeObject, ObjKey, TypeKey, World } from '@/types/common'
import { GameData, StaticData } from '@/types/api'
import { CategoryObject, initCategoryObject, initTypeObject, TypeClass, TypeObject } from '@/types/typeObjects'
import { GameClass, GameKey, GameObject, Player } from '@/objects/gameObjects'

export const useObjectsStore = defineStore('objects', {
  state: () => ({
    // These will be filled in init() or WorldManager.create()
    world: {
      id: '',
      sizeX: 0,
      sizeY: 0,
      turn: 0,
      year: 0,
      currentPlayer: '' as GameKey,
      tiles: {},
    } as World,

    _staticObjects: {} as Readonly<Record<CatKey | TypeKey, CategoryObject | TypeObject>>,
    _categoryTypesIndex: new Map<CatKey, Set<TypeKey>>(),
    _classTypesIndex: new Map<TypeClass, Set<TypeKey>>(),
    _classCatsIndex: new Map<TypeClass, Set<CatKey>>(),

    _gameObjects: {} as Record<GameKey, GameObject>,
    _classGameObjectsIndex: new Map<GameClass, Set<GameKey>>(),

    ready: false as boolean
  }),
  getters: {
    // Generic getter
    get: (state) => (key: ObjKey): CategoryObject | GameObject | TypeObject => {
      const obj = state._staticObjects[key as CatKey | TypeKey] ?? state._gameObjects[key as GameKey]
      if (!obj) throw new Error(`[objects] Unknown key: ${key}`)
      return obj
    },

    // Specific getters

    getGameObject: (state) => (key: GameKey): GameObject => {
      const obj = state._gameObjects[key]
      if (!obj) throw new Error(`[objects] Unknown GameObject key: ${key}`)
      return obj
    },

    getCurrentPlayer: (state) => (): Player =>
      state._gameObjects[state.world.currentPlayer] as Player,

    getTypeObject: (state) => (key: TypeKey): TypeObject => {
      const obj = state._staticObjects[key]
      if (!obj) throw new Error(`[objects] Unknown TypeObject key: ${key}`)
      if (!isTypeObject(obj)) throw new Error(`[objects] Not a TypeObject: ${key} : ${JSON.stringify(obj)}`)
      return obj
    },

    getCategoryObject: (state) => (key: CatKey): CategoryObject => {
      const obj = state._staticObjects[key]
      if (!obj) throw new Error(`[objects] Unknown CategoryObject key: ${key}`)

      // Allow TypeObjects (Tech uses EraType as its Category)
      if (!isCategoryObject(obj) && !isTypeObject(obj)) throw new Error(`[objects] Not a CategoryObject: ${key}`)
      return obj as CategoryObject
    },

    // TypeObjects-array getters

    getAllTypes: (state) => (): TypeObject[] => Object.values(state._staticObjects).filter(isTypeObject),

    getCategoryTypes: (state) => (catKey: CatKey): TypeObject[] => {
      const set = state._categoryTypesIndex.get(catKey)
      if (!set) return []
      return Array.from(set).map(key => state._staticObjects[key] as TypeObject)
    },

    getClassTypes: (state) => (typeClass: TypeClass): TypeObject[] => {
      const set = state._classTypesIndex.get(typeClass)
      if (!set) return []
      return Array.from(set).map(key => state._staticObjects[key] as TypeObject)
    },

    getClassTypesPerCategory: (state) => (typeClass: TypeClass): {
      category: CategoryObject,
      types: TypeObject[]
    }[] => {
      const output = [] as { category: CategoryObject, types: TypeObject[] }[]
      const catsSet = state._classCatsIndex.get(typeClass)
      if (!catsSet) return output

      for (const catKey of catsSet) {
        output.push({
          category: state._staticObjects[catKey] as CategoryObject,
          types: Array.from(state._categoryTypesIndex.get(catKey) ?? [])
            .map(key => state._staticObjects[key] as TypeObject)
        })
      }
      return output
    },

    getClassCategories: (state) => (typeClass: TypeClass): CategoryObject[] => {
      const set = state._classCatsIndex.get(typeClass)
      if (!set) return []
      return Array.from(set).map(key => state._staticObjects[key] as CategoryObject)
    },

    // GameObjects-array getters

    getClassGameObjects: (state) => (gameClass: GameClass): GameObject[] => {
      const set = state._classGameObjectsIndex.get(gameClass)
      if (!set) return []
      return Array.from(set).map(key => state._gameObjects[key])
    },
  },

  actions: {
    init (staticData: StaticData, gameData?: GameData) {
      if (this.ready) throw new Error('Objects Store already initialized')

      // 1) Initialize static objects
      const staticObjects = {} as Record<string, CategoryObject | TypeObject>
      for (const data of staticData.types) {
        staticObjects[data.key] = Object.freeze(markRaw(initTypeObject(data)))
      }
      for (const data of staticData.categories) {
        staticObjects[data.key] = Object.freeze(markRaw(initCategoryObject(data)))
      }
      this._staticObjects = Object.freeze(markRaw(staticObjects))

      // 2) Initialize the world
      if (gameData) {
        this.world.id = gameData.world.id
        this.world.sizeX = gameData.world.sizeX
        this.world.sizeY = gameData.world.sizeY
        this.world.turn = gameData.world.turn
        this.world.year = gameData.world.year
        this.world.currentPlayer = gameData.world.currentPlayer
      }

      // 3) Initialize game objects
      if (gameData) {
        const gameObjects = {} as Record<string, GameObject>
        for (const data of gameData.objects) {
          // todo: freeze old game objects (eg dead units, ended deals, completed goals, etc)
          // gameObjects[data.key] = init(data)
        }
        this._gameObjects = gameObjects
      }

      // 4) Build Type indexes
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

      // 5) Build GameObject indexes
      this._cacheGameObjects()

      this.ready = true
      console.log('Objects Store initialized')
    },

    set (obj: GameObject) {
      if (!obj.key) throw new Error('GameObject must have a key')
      if (this._gameObjects[obj.key]) throw new Error(`GameObject ${obj.key} already exists`)
      this._gameObjects[obj.key] = obj

      this._cacheGameObjects([obj])
    },

    bulkSet (objs: GameObject[]) {
      if (!objs.length) return

      // Validate and prepare in one pass
      const incoming: Record<GameKey, GameObject> = {}
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
        incoming[obj.key] = obj
      }
      if (errors.length) throw new Error(errors.join('\n'))

      const hasExisting = Object.keys(this._gameObjects).length > 0
      this._gameObjects = hasExisting
        ? { ...this._gameObjects, ...incoming }
        : incoming

      this._cacheGameObjects(objs)
    },

    _cacheGameObjects (gameObjects?: GameObject[]) {
      for (const obj of gameObjects ?? Object.values(this._gameObjects)) {
        const classGameObjects = this._classGameObjectsIndex.get(obj.class)
        if (classGameObjects) {
          classGameObjects.add(obj.key)
        } else {
          this._classGameObjectsIndex.get(obj.class)?.delete(obj.key)
        }
      }

    },

    delete (gameKey: GameKey) {
      if (!this._gameObjects[gameKey]) throw new Error(`GameObject ${gameKey} does not exist`)

      // Delete it from indexes and objects
      this._classGameObjectsIndex.get(this.getGameObject(gameKey).class)?.delete(gameKey)
      delete this._gameObjects[gameKey]
    },
  }
})
