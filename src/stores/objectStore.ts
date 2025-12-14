import { markRaw, shallowRef } from "vue";

import { defineStore } from "pinia";
import {
  CatKey,
  isCategoryObject,
  isTypeObject,
  ObjKey,
  TypeKey,
  WorldState,
} from "@/types/common";
import { StaticData } from "@/types/api";
import {
  type CategoryObject,
  initCategoryObject,
  initTypeObject,
  type TypeClass,
  type TypeObject,
} from "@/types/typeObjects";
import { GameClass, GameKey, GameObject } from "@/objects/game/_GameObject";
import { withCallerContext } from "@/utils/stack";
import { Player } from "@/objects/game/Player";
import { Tile } from "@/objects/game/Tile";

export const useObjectsStore = defineStore("objects", {
  state: () => ({
    // These will be filled in init() or WorldManager.create()
    world: {
      id: "",
      size: { x: 0, y: 0 },
      turn: 0,
      year: 0,
      currentPlayer: "" as GameKey,
    } as WorldState,

    _staticObjects: {} as Readonly<Record<CatKey | TypeKey, CategoryObject | TypeObject>>,
    _categoryTypesIndex: shallowRef(new Map<CatKey, Set<TypeKey>>()),
    _classTypesIndex: shallowRef(new Map<TypeClass, Set<TypeKey>>()),
    _classCatsIndex: shallowRef(new Map<TypeClass, Set<CatKey>>()),

    _gameObjects: shallowRef<Record<GameKey, GameObject>>({}),
    _classGameObjectsIndex: shallowRef(new Map<GameClass, Set<GameKey>>()),

    ready: false as boolean,
    activeBulkLoad: null as string | null,
  }),
  getters: {
    // Generic getter
    get:
      (state) =>
      (key: ObjKey): CategoryObject | GameObject | TypeObject => {
        const obj =
          state._staticObjects[key as CatKey | TypeKey] ?? state._gameObjects[key as GameKey];
        if (!obj) throwWithContext(`[objStore] Tried to get(${key}), key does not exist in store`);
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

    currentPlayer: (state): Player => {
      const player = state._gameObjects[state.world.currentPlayer];
      if (!player)
        throwWithContext(
          `[objStore] Tried to ge current player (${state.world.currentPlayer}), key does not exist in store`,
        );
      return player as Player;
    },

    getTypeObject:
      (state) =>
      (key: TypeKey): TypeObject => {
        const obj = state._staticObjects[key];
        if (!obj)
          throwWithContext(
            `[objStore] Tried to getTypeObject(${key}), key does not exist in store`,
          );
        if (!isTypeObject(obj))
          throwWithContext(`[objStore] Not a TypeObject: ${key} : ${JSON.stringify(obj)}`);
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
        return Array.from(set).map((key) => state._staticObjects[key] as TypeObject);
      },

    getClassTypes:
      (state) =>
      (typeClass: TypeClass): TypeObject[] => {
        const set = state._classTypesIndex.get(typeClass);
        if (!set) return [];
        return Array.from(set).map((key) => state._staticObjects[key] as TypeObject);
      },

    getClassTypesPerCategory:
      (state) =>
      (typeClass: TypeClass): CatData[] => {
        const output = [] as CatData[];
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
        return Array.from(set).map((key) => state._staticObjects[key] as CategoryObject);
      },

    // GameObjects-array getters

    getClassGameObjects:
      (state) =>
      (gameClass: GameClass): GameObject[] => {
        const set = state._classGameObjectsIndex.get(gameClass);
        if (!set) return [];
        return Array.from(set).map((key) => state._gameObjects[key]);
      },

    getTiles: (state): Record<GameKey, Tile> => {
      const out = {} as Record<GameKey, Tile>;
      for (const tileKey of state._classGameObjectsIndex.get("tile")!) {
        out[tileKey] = state._gameObjects[tileKey] as Tile;
      }
      return out;
    },
  },

  actions: {
    initStatic(staticData: StaticData) {
      if (Object.keys(this._staticObjects).length > 0) {
        throwWithContext("Objects Store static objects already initialized");
      }

      const staticObjects = {} as Record<string, CategoryObject | TypeObject>;
      for (const data of staticData.types) {
        staticObjects[data.key] = Object.freeze(markRaw(initTypeObject(data)));
      }
      for (const data of staticData.categories) {
        staticObjects[data.key] = Object.freeze(markRaw(initCategoryObject(data)));
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
      this._classGameObjectsIndex.clear();
      this.ready = false;
    },

    set(obj: GameObject) {
      if (!obj.key) throwWithContext("GameObject must have a key");
      if (this._gameObjects[obj.key]) throwWithContext(`GameObject ${obj.key} already exists`);
      this._gameObjects[obj.key] = markRaw(obj);

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

      // Directly set by the key to prevent reactivity issues mid-load
      for (const [k, v] of Object.entries(incoming)) {
        this._gameObjects[k as GameKey] = markRaw(v);
      }
      this._cacheGameObjects(Object.values(incoming));
    },

    _cacheGameObjects(gameObjects?: GameObject[]) {
      for (const obj of gameObjects ?? Object.values(this._gameObjects)) {
        const classGameObjects = this._classGameObjectsIndex.get(obj.class);
        if (classGameObjects) {
          classGameObjects.add(obj.key);
        } else {
          this._classGameObjectsIndex.set(obj.class, new Set([obj.key]));
        }
      }
    },

    delete(gameKey: GameKey) {
      if (!this._gameObjects[gameKey]) throwWithContext(`GameObject ${gameKey} does not exist`);

      // Delete it from indexes and objects
      this._classGameObjectsIndex.get(this.getGameObject(gameKey).class)?.delete(gameKey);
      delete this._gameObjects[gameKey];
    },
  },
});

function throwWithContext(message: string) {
  throw withCallerContext(message, ["/src/stores/objectStore.ts"]);
}

export type CatData = {
  category: CategoryObject;
  types: TypeObject[];
};
