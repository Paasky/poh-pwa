// noinspection JSUnusedGlobalSymbols

import type { CatKey, TypeKey, WorldState } from "@/types/common";
import {
  type CategoryClass,
  type CategoryObject,
  initCategoryObject,
  initTypeObject,
  type TypeClass,
  type TypeObject,
} from "@/types/typeObjects";
import type { GameClass, GameKey, GameObject, IRawGameObject } from "@/objects/game/_GameObject";
import { GameDataLoader } from "@/dataLoaders/GameDataLoader";
import type { Tile } from "@/objects/game/Tile";

// todo create a IRawType & IRawCategory
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawStaticData = { categories: any[]; types: any[] };
export type RawSaveData = { objects: IRawGameObject[]; world: WorldState };

export class DataBucket {
  // Static Types and Categories
  private readonly categoryTypesIndex = new Map<CatKey, Set<TypeKey>>();
  private readonly classTypesIndex = new Map<TypeClass, Set<TypeKey>>();
  private readonly classCatsIndex = new Map<CategoryClass, Set<CatKey>>();

  // Dynamic Game Objects
  private readonly classObjectsIndex = new Map<GameClass, Set<GameKey>>();

  private readonly dataLoader: GameDataLoader;

  constructor(
    private readonly types: Map<TypeKey, TypeObject>,
    private readonly categories: Map<CatKey, CategoryObject>,
    private readonly objects: Map<GameKey, GameObject>,
    readonly world: WorldState,
    dataLoader?: GameDataLoader,
  ) {
    this.dataLoader = dataLoader ?? new GameDataLoader();

    // Build indexes
    this.types.forEach((t) => this.buildTypeIndex(t));
    this.categories.forEach((c) => this.buildCategoryIndex(c));
    this.objects.forEach((o) => this.buildObjectIndex(o));
  }

  static fromRaw(rawStaticData: RawStaticData, rawSaveData: RawSaveData): DataBucket {
    const types = new Map<TypeKey, TypeObject>();
    const categories = new Map<CatKey, CategoryObject>();
    const objects = new Map<GameKey, GameObject>();

    for (const data of rawStaticData.types) {
      types.set(data.key as TypeKey, Object.freeze(initTypeObject(data)) as TypeObject);
    }

    for (const data of rawStaticData.categories) {
      categories.set(data.key as CatKey, Object.freeze(initCategoryObject(data)) as CategoryObject);
    }

    const dataLoader = new GameDataLoader();
    dataLoader.initFromRaw(rawSaveData.objects, objects);

    return new DataBucket(types, categories, objects, rawSaveData.world, dataLoader);
  }

  getType(key: TypeKey): TypeObject {
    const type = this.types.get(key);
    if (!type) throw new Error(`DataBucket.getType(${key}) does not exist!`);
    return type;
  }

  getCategory(key: CatKey): CategoryObject {
    const category = this.categories.get(key);
    if (!category) throw new Error(`DataBucket.getCategory(${key}) does not exist!`);
    return category;
  }

  getTypes(): TypeObject[] {
    return Array.from(this.types.values());
  }

  getCats(): CategoryObject[] {
    return Array.from(this.categories.values());
  }

  getCategoryTypes(catKey: CatKey): Set<TypeObject> {
    const out = new Set<TypeObject>();
    const categoryTypes = this.categoryTypesIndex.get(catKey);
    if (!categoryTypes) throw new Error(`DataBucket.getCategoryTypes(${catKey}) does not exist!`);

    categoryTypes.forEach((key) => out.add(this.getType(key)));
    return out;
  }

  getClassTypes(classKey: TypeClass): Set<TypeObject> {
    const out = new Set<TypeObject>();
    const classTypes = this.classTypesIndex.get(classKey);
    if (!classTypes) throw new Error(`DataBucket.getClassTypes(${classKey}) does not exist!`);

    classTypes.forEach((key) => out.add(this.getType(key)));
    return out;
  }

  getClassCats(classKey: CategoryClass): Set<CategoryObject> {
    const out = new Set<CategoryObject>();
    const classCats = this.classCatsIndex.get(classKey);
    if (!classCats) throw new Error(`DataBucket.getClassCats(${classKey}) does not exist!`);

    classCats.forEach((key) => out.add(this.getCategory(key)));
    return out;
  }

  getClassObjects<T extends GameObject>(classKey: GameClass): Set<T> {
    const out = new Set<T>();
    const classObjects = this.classObjectsIndex.get(classKey);
    if (!classObjects) throw new Error(`DataBucket.getClassObjects(${classKey}) does not exist!`);

    classObjects.forEach((key) => out.add(this.getObject(key)));
    return out;
  }

  getObject<T extends GameObject>(key: GameKey): T {
    const object = this.objects.get(key) as T;
    if (!object) throw new Error(`DataBucket.getObject(${key}) does not exist!`);
    return object;
  }

  getObjects(): GameObject[] {
    return [...this.objects.values()];
  }

  getTiles(): Record<GameKey, Tile> {
    const out = {} as Record<GameKey, Tile>;
    this.getClassObjects<Tile>("tile").forEach((tile) => {
      out[tile.key] = tile;
    });
    return out;
  }

  removeObject(key: GameKey): void {
    this.classObjectsIndex.get(this.getObject(key).class)?.delete(key);
    this.objects.delete(key);
  }

  setObject(object: GameObject): void {
    this.objects.set(object.key, object);
    this.buildObjectIndex(object);
  }

  setRawObjects(objects: IRawGameObject[]): GameObject[] {
    const newRawObjects = [] as IRawGameObject[];
    const updatedObjects = [] as GameObject[];

    objects.forEach((obj) => {
      const existing = this.objects.get(obj.key);
      if (existing) {
        //todo we must use attrConf of the model; currently this allows invalid data to go in
        Object.assign(existing, obj);
        existing.onUpdate(obj);
        updatedObjects.push(existing);
      } else {
        newRawObjects.push(obj);
      }
    });

    const newObjects = this.dataLoader.initFromRaw(newRawObjects, this.objects);
    newObjects.forEach((obj) => {
      this.buildObjectIndex(obj);
      obj.onCreated();
    });

    return [...updatedObjects, ...newObjects];
  }

  toSaveData(): RawSaveData {
    const out = { objects: [] as IRawGameObject[], world: this.world };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.objects.forEach((o) => out.objects.push(o.toJSON() as any as IRawGameObject));
    return out;
  }

  // Used to restore a save (if a Mutation set has failed)
  restore(data: RawSaveData) {
    this.objects.clear();
    Object.assign(this.world, data.world);
    this.setRawObjects(data.objects);
  }

  private buildTypeIndex(type: TypeObject) {
    const classTypes = this.classTypesIndex.get(type.class);
    if (classTypes) {
      classTypes.add(type.key);
    } else {
      this.classTypesIndex.set(type.class, new Set([type.key]));
    }

    if (type.category) {
      const catTypes = this.categoryTypesIndex.get(type.category);
      if (catTypes) {
        catTypes.add(type.key);
      } else {
        this.categoryTypesIndex.set(type.category, new Set([type.key]));
      }
    }
  }

  private buildCategoryIndex(category: CategoryObject) {
    const classCats = this.classCatsIndex.get(category.class);
    if (classCats) {
      classCats.add(category.key);
    } else {
      this.classCatsIndex.set(category.class, new Set([category.key]));
    }
  }

  private buildObjectIndex(object: GameObject) {
    const classObjects = this.classObjectsIndex.get(object.class);
    if (classObjects) {
      classObjects.add(object.key);
    } else {
      this.classObjectsIndex.set(object.class, new Set([object.key]));
    }
  }
}
