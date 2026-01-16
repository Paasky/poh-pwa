// noinspection JSUnusedGlobalSymbols

import { rng } from "@/Common/Helpers/Rng";
import type { GameClass, GameKey, GameObject, IRawGameObject } from "@/Common/Models/_GameModel";
import { GameDataLoader } from "@/Data/GameDataLoader";
import { setDataBucket } from "@/Data/useDataBucket";
import type { Tile } from "@/Common/Models/Tile";
import { getStaticData, load } from "@/Data/StaticDataLoader";
import { WorldState } from "@/Common/Objects/World";
import {
  CatData,
  CategoryClass,
  CatKey,
  StaticKey,
  TypeClass,
  TypeKey,
} from "@/Common/Static/StaticEnums";
import { TypeObject } from "@/Common/Static/Objects/TypeObject";
import { CategoryObject } from "@/Common/Static/Objects/CategoryObject";
import { CompiledStaticData } from "@/Data/StaticDataCompiler";
import { formatYear } from "@/Common/Helpers/time";
import { WorldLinks } from "@/Data/WorldLinks";

export type RawSaveData = {
  name: string; // "Leader Name - Culture Name" (user editable)
  time: number; // UTC timestamp (ms)
  version: string; // Schema version from package.json
  objects: IRawGameObject[];
  world: WorldState;
  rngState?: object;
};

export class DataBucket {
  public readonly links: WorldLinks;

  // Static Types and Categories
  private readonly categoryTypesIndex = new Map<StaticKey, Set<TypeKey>>();
  private readonly classTypesIndex = new Map<TypeClass, Set<TypeKey>>();
  private readonly classCatsIndex = new Map<CategoryClass, Set<StaticKey>>();

  // Dynamic Game Objects
  private readonly classObjectsIndex = new Map<GameClass, Set<GameKey>>();

  private readonly dataLoader: GameDataLoader;

  private constructor(
    private readonly types: Map<TypeKey, TypeObject>,
    private readonly categories: Map<StaticKey, CategoryObject>,
    private readonly _world: WorldState,
    private readonly objects: Map<GameKey, GameObject> = new Map(),
    dataLoader?: GameDataLoader,
  ) {
    this.links = new WorldLinks(this);
    this.dataLoader = dataLoader ?? new GameDataLoader(this);

    // Build indexes
    this.types.forEach((t) => this.buildTypeIndex(t));
    this.categories.forEach((c) => this.buildCategoryIndex(c));
    this.objects.forEach((o) => this.buildObjectIndex(o));
  }

  static async init(compiledStaticData?: CompiledStaticData): Promise<DataBucket> {
    return this.fromRaw(compiledStaticData ?? (await getStaticData()), {} as WorldState);
  }

  static fromRaw(
    compiledStaticData: CompiledStaticData,
    world: WorldState,
    rawObjects?: IRawGameObject[],
  ): DataBucket {
    const { types, categories } = load(compiledStaticData);

    // 5. Freeze & Finalize
    types.forEach((obj) => Object.freeze(obj));
    categories.forEach((cat) => Object.freeze(cat));

    const instance = new DataBucket(types, categories, world);
    setDataBucket(instance);

    if (rawObjects) {
      instance.setRawObjects(rawObjects);
    }

    return instance;
  }

  getType(key: TypeKey): TypeObject {
    const type = this.types.get(key);
    if (!type) throw new Error(`DataBucket.getType(${key}) does not exist!`);
    return type;
  }

  getCategory(key: StaticKey): CategoryObject {
    const category = this.categories.get(key);
    if (!category) {
      // Special case for Eras: eraType is used as category for techs
      if (key.startsWith("eraType:")) {
        const era = this.types.get(key as TypeKey);
        // Special exception (no casting rule): Era is a Type, but is used as a Technology Category to avoid duplication of the same data
        if (era) return era as unknown as CategoryObject;
      }

      throw new Error(`DataBucket.getCategory(${key}) does not exist!`);
    }
    return category;
  }

  getTypes(): Set<TypeObject> {
    return new Set(this.types.values());
  }

  getCats(): Set<CategoryObject> {
    return new Set(this.categories.values());
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

  getClassTypesPerCategory(classKey: TypeClass): Map<StaticKey, CatData> {
    const classTypes = this.getClassTypes(classKey);
    if (!classTypes) throw new Error(`DataBucket.getClassTypes(${classKey}) does not exist!`);

    const out = new Map<StaticKey, CatData>();
    classTypes.forEach((type) => {
      const categoryKey = type.category!;
      if (categoryKey) {
        const catData = out.get(categoryKey);
        if (catData) {
          catData.types.add(type);
        } else {
          const newCatData: CatData = {
            category: this.getCategory(categoryKey),
            types: new Set([type]),
          };
          out.set(categoryKey, newCatData);
        }
      }
    });
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
    const classObjects = this.classObjectsIndex.get(classKey);
    if (!classObjects) return new Set<T>();

    const out = new Set<T>();
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

  get world(): WorldState {
    if (!this._world.id) throw new Error("DataBucket.world is not initialized!");
    return this._world;
  }

  get year(): string {
    return formatYear(this.world.year);
  }

  removeObject(key: GameKey): void {
    const object = this.getObject(key);
    this.dataLoader.removeRelations(object, this.objects);

    this.classObjectsIndex.get(object.class)?.delete(key);
    this.objects.delete(key);
  }

  setObject(object: GameObject): void {
    this.objects.set(object.key, object);
    this.buildObjectIndex(object);
  }

  setRawObjects(objects: IRawGameObject[]): GameObject[] {
    const updates = new Map<GameKey, IRawGameObject>();

    objects.forEach((obj) => {
      if (this.objects.has(obj.key)) {
        updates.set(obj.key, obj);
      }
    });

    const { created, updated } = this.dataLoader.setFromRaw(objects, this.objects);
    created.forEach((obj) => {
      this.buildObjectIndex(obj);
      obj.onCreate();
    });
    updated.forEach((obj) => {
      this.buildObjectIndex(obj);
      obj.onUpdate(updates.get(obj.key)!);
    });

    return [...created, ...updated];
  }

  setWorld(world: Partial<WorldState>): void {
    Object.assign(this._world, world);
  }

  toSaveData(name: string, version: string): RawSaveData {
    return {
      name,
      time: Date.now(),
      version,
      objects: Array.from(this.objects.values()).map(
        (o) => o.toJSON() as unknown as IRawGameObject,
      ),
      world: JSON.parse(JSON.stringify(this._world)),
      rngState: rng.getState(),
    };
  }

  // Used to restore a save (if a Mutation set has failed)
  restore(data: RawSaveData) {
    this.objects.clear();
    Object.assign(this._world, data.world);
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
