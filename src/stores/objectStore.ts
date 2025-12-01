import { markRaw } from "vue";
import { defineStore } from "pinia";
import {
  CatKey,
  isCategoryObject,
  isTypeObject,
  ObjKey,
  TypeKey,
  World,
} from "@/types/common";
import { GameData, StaticData } from "@/types/api";
import {
  CategoryObject,
  initCategoryObject,
  initTypeObject,
  TypeClass,
  TypeObject,
} from "@/types/typeObjects";
import {
  GameClass,
  GameKey,
  GameObject,
  Player,
} from "@/objects/game/gameObjects";
import { GameDataLoader } from "@/dataLoaders/gameDataLoader";
import { withCallerContext } from "@/utils/stack";

export const useObjectsStore = defineStore("objects", {
  state: () => ({
    // These will be filled in init() or WorldManager.create()
    world: {
      id: "",
      sizeX: 0,
      sizeY: 0,
      turn: 0,
      year: 0,
      currentPlayer: "" as GameKey,
      tiles: {},
    } as World,

    _staticObjects: {} as Readonly<
      Record<CatKey | TypeKey, CategoryObject | TypeObject>
    >,
    _categoryTypesIndex: new Map<CatKey, Set<TypeKey>>(),
    _classTypesIndex: new Map<TypeClass, Set<TypeKey>>(),
    _classCatsIndex: new Map<TypeClass, Set<CatKey>>(),

    _gameObjects: {} as Record<GameKey, GameObject>,
    _classGameObjectsIndex: new Map<GameClass, Set<GameKey>>(),

    ready: false as boolean,
  }),
  getters: {
    // Generic getter
    get:
      (state) =>
      (key: ObjKey): CategoryObject | GameObject | TypeObject => {
        const obj =
          state._staticObjects[key as CatKey | TypeKey] ??
          state._gameObjects[key as GameKey];
        if (!obj)
          throwWithContext(
            `[objStore] Tried to get(${key}), key does not exist in store`,
          );
        return obj;
      },

    // Specific getters

    getGameObject:
      (state) =>
      (key: GameKey): GameObject => {
        const obj = state._gameObjects[key];
        if (!obj)
          throwWithContext(
            `[objStore] Tried to getGameObject(${key}), key does not exist in store`,
          );
        return obj;
      },

    getCurrentPlayer: (state) => (): Player =>
      state._gameObjects[state.world.currentPlayer] as Player,

    getTypeObject:
      (state) =>
      (key: TypeKey): TypeObject => {
        const obj = state._staticObjects[key];
        if (!obj)
          throwWithContext(
            `[objStore] Tried to getTypeObject(${key}), key does not exist in store`,
          );
        if (!isTypeObject(obj))
          throwWithContext(
            `[objStore] Not a TypeObject: ${key} : ${JSON.stringify(obj)}`,
          );
        return obj as TypeObject;
      },

    getCategoryObject:
      (state) =>
      (key: CatKey): CategoryObject => {
        const obj = state._staticObjects[key];
        if (!obj)
          throwWithContext(
            `[objStore] Tried to getCategoryObject(${key}), key does not exist in store`,
          );

        // Allow TypeObjects (Tech uses EraType as its Category)
        if (!isCategoryObject(obj) && !isTypeObject(obj))
          throwWithContext(`[objStore] Not a CategoryObject: ${key}`);
        return obj as CategoryObject;
      },

    // TypeObjects-array getters

    getAllTypes: (state) => (): TypeObject[] =>
      Object.values(state._staticObjects).filter(isTypeObject),

    getCategoryTypes:
      (state) =>
      (catKey: CatKey): TypeObject[] => {
        const set = state._categoryTypesIndex.get(catKey);
        if (!set) return [];
        return Array.from(set).map(
          (key) => state._staticObjects[key] as TypeObject,
        );
      },

    getClassTypes:
      (state) =>
      (typeClass: TypeClass): TypeObject[] => {
        const set = state._classTypesIndex.get(typeClass);
        if (!set) return [];
        return Array.from(set).map(
          (key) => state._staticObjects[key] as TypeObject,
        );
      },

    getClassTypesPerCategory:
      (state) =>
      (
        typeClass: TypeClass,
      ): {
        category: CategoryObject;
        types: TypeObject[];
      }[] => {
        const output = [] as {
          category: CategoryObject;
          types: TypeObject[];
        }[];
        const catsSet = state._classCatsIndex.get(typeClass);
        if (!catsSet) return output;

        for (const catKey of catsSet) {
          output.push({
            category: state._staticObjects[catKey] as CategoryObject,
            types: Array.from(state._categoryTypesIndex.get(catKey) ?? []).map(
              (key) => state._staticObjects[key] as TypeObject,
            ),
          });
        }
        return output;
      },

    getClassCategories:
      (state) =>
      (typeClass: TypeClass): CategoryObject[] => {
        const set = state._classCatsIndex.get(typeClass);
        if (!set) return [];
        return Array.from(set).map(
          (key) => state._staticObjects[key] as CategoryObject,
        );
      },

    // GameObjects-array getters

    getClassGameObjects:
      (state) =>
      (gameClass: GameClass): GameObject[] => {
        const set = state._classGameObjectsIndex.get(gameClass);
        if (!set) return [];
        return Array.from(set).map((key) => state._gameObjects[key]);
      },
  },

  actions: {
    init(staticData: StaticData, gameData: GameData) {
      if (this.ready) throwWithContext("Objects Store already initialized");

      this.initStatic(staticData);
      this.initGame(gameData);

      console.log("Objects Store initialized");
    },

    initGame(gameData: GameData) {
      if (this.ready) throwWithContext("Objects Store already initialized");

      this.world = gameData.world;

      new GameDataLoader().load(gameData);
      this._cacheGameObjects();

      if (Object.keys(this._staticObjects).length > 0) {
        this.ready = true;
      }
    },

    initStatic(staticData: StaticData) {
      if (this.ready) throwWithContext("Objects Store already initialized");
      if (Object.keys(this._staticObjects).length > 0) return;

      const staticObjects = {} as Record<string, CategoryObject | TypeObject>;
      for (const data of staticData.types) {
        staticObjects[data.key] = Object.freeze(markRaw(initTypeObject(data)));
      }
      for (const data of staticData.categories) {
        staticObjects[data.key] = Object.freeze(
          markRaw(initCategoryObject(data)),
        );
      }
      this._staticObjects = Object.freeze(markRaw(staticObjects));

      // Build Type indexes
      for (const obj of Object.values(this._staticObjects)) {
        if (!isTypeObject(obj)) continue;

        const classTypes = this._classTypesIndex.get(obj.class);
        if (classTypes) {
          classTypes.add(obj.key);
        } else {
          this._classTypesIndex.set(obj.class, new Set([obj.key]));
        }

        if (obj.category) {
          const catTypes = this._categoryTypesIndex.get(obj.category);
          if (catTypes) {
            catTypes.add(obj.key);
          } else {
            this._categoryTypesIndex.set(obj.category, new Set([obj.key]));
          }

          const classCats = this._classCatsIndex.get(obj.class);
          if (classCats) {
            classCats.add(obj.category);
          } else {
            this._classCatsIndex.set(obj.class, new Set([obj.category]));
          }
        }
      }

      if (Object.keys(this._gameObjects).length > 0) {
        this.ready = true;
      }
    },

    resetGame() {
      this._gameObjects = {};
      this.ready = false;
    },

    set(obj: GameObject) {
      if (!obj.key) throwWithContext("GameObject must have a key");
      if (this._gameObjects[obj.key])
        throwWithContext(`GameObject ${obj.key} already exists`);
      this._gameObjects[obj.key] = obj;

      this._cacheGameObjects([obj]);
    },

    bulkSet(objs: GameObject[]) {
      if (!objs.length) return;

      // Validate and prepare in one pass
      const incoming: Record<GameKey, GameObject> = {};
      const errors = [];
      for (const obj of objs) {
        if (!obj.key) {
          errors.push("GameObject must have a key: " + JSON.stringify(obj));
          continue;
        }
        if (this._gameObjects[obj.key] || incoming[obj.key]) {
          errors.push(`GameObject ${obj.key} already exists`);
          continue;
        }
        // Keep reactivity consistent with init
        incoming[obj.key] = obj;
      }
      if (errors.length) throwWithContext(errors.join("\n"));

      const hasExisting = Object.keys(this._gameObjects).length > 0;
      this._gameObjects = hasExisting
        ? { ...this._gameObjects, ...incoming }
        : incoming;

      this._cacheGameObjects(objs);
    },

    _cacheGameObjects(gameObjects?: GameObject[]) {
      for (const obj of gameObjects ?? Object.values(this._gameObjects)) {
        const classGameObjects = this._classGameObjectsIndex.get(obj.class);
        if (classGameObjects) {
          classGameObjects.add(obj.key);
        } else {
          this._classGameObjectsIndex.get(obj.class)?.delete(obj.key);
        }
      }
    },

    delete(gameKey: GameKey) {
      if (!this._gameObjects[gameKey])
        throwWithContext(`GameObject ${gameKey} does not exist`);

      // Delete it from indexes and objects
      this._classGameObjectsIndex
        .get(this.getGameObject(gameKey).class)
        ?.delete(gameKey);
      delete this._gameObjects[gameKey];
    },
  },
});

function throwWithContext(message: string) {
  throw withCallerContext(message, ["/src/stores/objectStore.ts"]);
}
