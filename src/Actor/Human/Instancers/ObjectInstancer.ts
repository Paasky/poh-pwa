import { Coords, tileHeight } from "@/Common/Helpers/mapTools";
import { GameKey } from "@/Common/Models/_GameModel";
import { InstancedMesh, Matrix, Mesh, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { TypeKey } from "@/Common/Objects/Common";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { objectBaseMesh } from "@/Actor/Human/Assets/meshes/objects";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { Unit } from "@/Common/Models/Unit";
import { Construction } from "@/Common/Models/Construction";
import { tileCenter } from "@/Common/Helpers/math";
import { Tile } from "@/Common/Models/Tile";
import { EngineLayers } from "@/Actor/Human/EngineStyles";

export class ObjectInstancer {
  scene: Scene;
  size: Coords;
  root: TransformNode;
  designLib: Map<GameKey, Mesh> = new Map();
  typeLib: Map<TypeKey, Mesh> = new Map();

  constrReg: Map<GameKey, { typeKey: TypeKey; index: number }> = new Map();
  unitReg: Map<GameKey, { designKey: GameKey; instance: InstancedMesh }> = new Map();

  constrBatches: Map<TypeKey, ConstructionBatch> = new Map();

  constructor(scene: Scene, size: Coords, constructions: Construction[], units: Unit[]) {
    this.scene = scene;
    this.size = size;
    this.root = new TransformNode("objectsRoot", this.scene);

    this.setConstruction(...constructions);
    this.setUnit(...units);
  }

  deleteConstruction(constructionKey: GameKey): this {
    const reg = this.constrReg.get(constructionKey);
    if (!reg) {
      throw new Error(`Construction ${constructionKey} does not exist`);
    }

    const batch = this.constrBatches.get(reg.typeKey)!;
    const idx = reg.index;
    const last = batch.count - 1;

    if (idx !== last) {
      // swap last → deleted slot
      batch.matrices.copyWithin(idx * 16, last * 16, last * 16 + 16);

      // fix moved key index
      for (const [k, i] of batch.indexByKey) {
        if (i === last) {
          batch.indexByKey.set(k, idx);
          this.constrReg.get(k)!.index = idx;
          break;
        }
      }
    }

    batch.indexByKey.delete(constructionKey);
    this.constrReg.delete(constructionKey);

    batch.count--;
    batch.mesh.thinInstanceBufferUpdated("matrix");

    return this;
  }

  deleteUnit(unitKey: GameKey): this {
    const regUnit = this.unitReg.get(unitKey);
    if (!regUnit) {
      throw new Error(`Unit ${unitKey} does not exist`);
    }

    regUnit.instance.dispose();
    this.unitReg.delete(unitKey);

    return this;
  }

  setConstruction(...constructions: Construction[]): this {
    // Group by typeKey to pre-size buffers
    const byType = new Map<TypeKey, Construction[]>();
    for (const c of constructions) {
      if (!byType.has(c.type.key)) byType.set(c.type.key, []);
      byType.get(c.type.key)!.push(c);
    }

    for (const [typeKey, typeConstructions] of byType) {
      let batch = this.constrBatches.get(typeKey);
      const additional = typeConstructions.length;

      if (!batch) {
        const mesh = this.getTypeMesh(typeConstructions[0].type);

        // preallocate exactly enough for this batch
        batch = {
          mesh,
          matrices: new Float32Array(16 * Math.max(64, additional)),
          count: 0,
          indexByKey: new Map(),
        };

        mesh.thinInstanceSetBuffer("matrix", batch.matrices, 16, true);
        this.constrBatches.set(typeKey, batch);
      } else if ((batch.count + additional) * 16 > batch.matrices.length) {
        // grow once for all new instances
        const nextSize = Math.max(batch.matrices.length * 2, (batch.count + additional) * 16);
        const next = new Float32Array(nextSize);
        next.set(batch.matrices);
        batch.matrices = next;
        batch.mesh.thinInstanceSetBuffer("matrix", batch.matrices, 16, true);
      }

      for (const construction of typeConstructions) {
        const key = construction.key;
        const existing = this.constrReg.get(key);
        if (existing) {
          if (existing.typeKey !== typeKey) this.deleteConstruction(key);
          else throw new Error(`Construction ${key} already exists`);
        }

        const pos = this.getPos(construction.tile);
        const m = Matrix.Translation(pos.x, pos.y, pos.z);
        m.copyToArray(batch.matrices, batch.count * 16);

        batch.indexByKey.set(key, batch.count);
        this.constrReg.set(key, { typeKey, index: batch.count });

        batch.count++;
      }

      batch.mesh.thinInstanceBufferUpdated("matrix");
    }

    return this;
  }

  setUnit(...units: Unit[]): this {
    for (const unit of units) {
      const regUnit = this.unitReg.get(unit.key);
      if (regUnit) {
        if (regUnit.designKey !== unit.design.key) {
          this.deleteUnit(unit.key);
        } else {
          throw new Error(`Unit ${unit.key} already exists`);
        }
      }

      const instance = this.getDesignMesh(unit.design).createInstance(unit.key);
      instance.isVisible = true;
      instance.renderingGroupId = EngineLayers.units.group;
      instance.position.copyFrom(this.getPos(unit.tile));

      this.unitReg.set(unit.key, { instance, designKey: unit.design.key });
    }

    return this;
  }

  private getDesignMesh(design: UnitDesign): Mesh {
    if (!this.designLib.has(design.key)) {
      const baseMesh = objectBaseMesh(this.scene, design.platform.key);
      baseMesh.parent = this.root;
      baseMesh.renderingGroupId = EngineLayers.units.group;

      this.designLib.set(design.key, baseMesh);

      return baseMesh;
    }

    return this.designLib.get(design.key)!;
  }

  private getTypeMesh(type: TypeObject): Mesh {
    if (!this.typeLib.has(type.key)) {
      const baseMesh = objectBaseMesh(this.scene, type.key);
      baseMesh.parent = this.root;
      baseMesh.renderingGroupId = EngineLayers.constructions.group;

      this.typeLib.set(type.key, baseMesh);

      return baseMesh;
    }

    return this.typeLib.get(type.key)!;
  }

  private getPos(tile: Tile): Vector3 {
    const coords = tileCenter(this.size, tile);
    const height = tileHeight(tile, true);
    return new Vector3(coords.x, height, coords.z);
  }

  dispose(): void {
    for (const lib of this.designLib.values()) {
      lib.dispose(false, true);
    }
    for (const lib of this.typeLib.values()) {
      lib.dispose(false, true);
    }
    this.root.dispose(false, true);
  }
}

type ConstructionBatch = {
  mesh: Mesh;
  matrices: Float32Array;
  count: number;
  indexByKey: Map<GameKey, number>;
};
