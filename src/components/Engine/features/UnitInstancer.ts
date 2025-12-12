import { InstancedMesh, Mesh, Scene, TransformNode } from '@babylonjs/core'
import { Coords, tileHeight } from '@/helpers/mapTools'
import { Unit } from '@/objects/game/Unit'
import { GameKey } from '@/objects/game/_GameObject'
import { SolidParticleSystem } from '@babylonjs/core/Particles/solidParticleSystem'
import { UnitDesign } from '@/objects/game/UnitDesign'
import { designBaseMesh } from '@/assets/meshes/unitDesign'
import { tileCenter } from '@/helpers/math'

// lib is keyed by our internal unit design id (platform + equipment)
type LibEntry = {
  mesh: Mesh,
  instances: Record<GameKey, { tileKey: GameKey, mesh: InstancedMesh }>
}

export class UnitInstancer {
  scene: Scene
  size: Coords
  isVisible = true
  root: TransformNode

  lib = {} as Record<string, LibEntry>
  unitTileByKey = {} as Record<GameKey, GameKey>

  constructor (
    scene: Scene,
    size: Coords,
    parent: TransformNode,
    units: Unit[]
  ) {
    this.scene = scene
    this.size = size
    this.root = new TransformNode('unitsRoot', this.scene)
    this.root.parent = parent

    this.update(units)
  }

  setIsVisible (isVisible: boolean): this {
    this.isVisible = isVisible
    this.root.setEnabled(isVisible)
    return this
  }

  public update (units: Unit[]): this {
    // Take a copy we can reduce - anything left will be removed
    const prevUnitTileByKey = { ...this.unitTileByKey }

    for (const unit of units) {
      this.set(unit)
      delete prevUnitTileByKey[unit.key]
    }

    // Removed disappeared units
    for (const unitKey of Object.keys(prevUnitTileByKey)) {
      this.remove(unitKey as GameKey)
    }

    return this
  }

  // return true for added, false for updated
  set (unit: Unit): boolean {
    const libEntry = this.getLibEntry(unit.design.value)

    const instance = libEntry.instances[unit.key]
    const wasAdded = !instance

    const mesh = instance?.mesh ?? libEntry.mesh.createInstance(unit.key)

    // Parent and basic flags
    if (!instance) {
      mesh.parent = this.root
      mesh.isPickable = false
      mesh.isVisible = true
    }

    const newTileKey = unit.tileKey.value
    const prevTileKey = instance?.tileKey
    if (wasAdded || prevTileKey !== newTileKey) {
      const coords = tileCenter(this.size, unit.tile.value)
      mesh.position.set(coords.x, tileHeight(unit.tile.value, true), coords.z)
    }

    libEntry.instances[unit.key] = { tileKey: newTileKey, mesh }
    this.unitTileByKey[unit.key] = newTileKey

    return wasAdded
  }

  // Returns T/F was the unit was removed
  remove (unitKey: GameKey): boolean {
    delete this.unitTileByKey[unitKey]

    // Try to find the unit key in our library
    for (const [designId, libEntry] of Object.entries(this.lib)) {
      if (libEntry.instances[unitKey]) {
        // Found: dispose the mesh and delete the entry
        libEntry.instances[unitKey].mesh.dispose(false, true)
        delete libEntry.instances[unitKey]

        // If it makes us have 0 instances: dispose the design and delete it
        if (Object.keys(libEntry.instances).length === 0) {
          this.lib[designId].mesh.dispose()
          delete this.lib[designId]
        }

        return true
      }
    }

    return false
  }

  private getLibEntry (design: UnitDesign): LibEntry {
    const designId = `${design.platform.key}-${design.equipment.key}`

    if (!this.lib[designId]) {
      this.lib[designId] = {
        mesh: designBaseMesh(design),
        instances: {}
      }
    }
    return this.lib[designId]
  }

  private initSps (designId: string): SolidParticleSystem {
    return new SolidParticleSystem(
      `designs.${designId}SPS`,
      this.scene,
      { updatable: true }
    )
  }
}