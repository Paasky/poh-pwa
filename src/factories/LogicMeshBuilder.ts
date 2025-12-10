import { Mesh, Scene, TransformNode, Vector3 } from '@babylonjs/core'
import { Coords } from '@/helpers/mapTools'
import { Tile } from '@/objects/game/Tile'
import { getBaseTile } from '@/assets/meshes/tiles'
import type { TypeKey } from '@/types/common'
import { allTerrainMaterials } from '@/assets/materials/terrains'
import { useObjectsStore } from '@/stores/objectStore'
import { getWorldDepth, getWorldMinX, getWorldMinZ, getWorldWidth, hexDepth, hexWidth } from '@/helpers/math'

export class LogicMeshBuilder {
  scene: Scene
  size: Coords
  tilesByKey: Record<string, Tile>

  root: TransformNode

  mesh: Mesh | null = null

  constructor (scene: Scene, size: Coords, tilesByKey: Record<string, Tile>) {
    this.scene = scene
    this.size = size
    this.tilesByKey = tilesByKey

    this.root = new TransformNode('terrainRoot', this.scene)
  }

  build (): LogicMeshBuilder {

    // Create instances
    const baseTile = getBaseTile(scene)
    baseTile.parent = root

    const terrainMeshes: Record<TypeKey, Mesh> = {}
    for (const [terrainKey, terrainMaterial] of Object.entries(allTerrainMaterials(scene))) {
      // Clone a hidden master per terrain so each can have its own material.
      const mesh = baseTile.clone(`mesh-${terrainKey}`, root)
      mesh.material = terrainMaterial
      // Clones do not inherit visibility; explicitly keep masters hidden.
      mesh.isVisible = false
      terrainMeshes[terrainKey as TypeKey] = mesh
    }

    const objStore = useObjectsStore()
    const tiles = objStore.getClassGameObjects('tile') as Tile[]

    // Horizontal repeat period (distance between equivalent tiles across the wrap seam)
    const periodX = hexWidth * world.sizeX

    // Compute offsets to roughly center the grid around world origin
    const worldWidth = getWorldWidth(world.sizeX)
    const worldDepth = getWorldDepth(world.sizeY)
    const offsetX = getWorldMinX(worldWidth)
    const offsetZ = getWorldMinZ(worldDepth)

    // Determine horizontal replication indices (symmetrical around the center when odd)
    const repIndices: number[] = [-1, 0, 1]

    for (const tile of tiles) {
      const terrainMesh = terrainMeshes[tile.terrain.key]

      // Odd-r row offset on X for pointy-top
      const baseWx = offsetX + hexWidth * (tile.x + 0.5 * (tile.y & 1))
      const wz = offsetZ + hexDepth * tile.y

      // --- Elevation & water level ---
      // Minimal vertical placement: water below ground, hills/mountains above.
      // todo move to mapTools
      const isWaterTerrain =
        (tile.terrain.key as string) === 'terrainType:ocean' ||
        (tile.terrain.key as string) === 'terrainType:sea' ||
        (tile.terrain.key as string) === 'terrainType:coast' ||
        (tile.terrain.key as string) === 'terrainType:lake' ||
        (tile.terrain.key as string) === 'terrainType:majorRiver'

      // Choose offsets based on hex radius for visibility (independent of mesh thickness)
      let yOffset = 0

      if (isWaterTerrain) {
        // Water sits below ground plane; deeper for ocean/sea than coast/lake
        // todo move to mapTools as constants (oceanHeight=-0.8 etc)
        switch (tile.terrain.key) {
          case 'terrainType:ocean':
            yOffset = -0.8
            break
          case 'terrainType:sea':
            yOffset = -0.6
            break
          default:
            yOffset = -0.4
        }
      } else {
        switch (tile.elevation.key) {
          case 'elevationType:hill':
            // todo move to mapTools as constants (hillHeight=0.4 etc)
            yOffset = 0.4 // rolling hills
            break
          case 'elevationType:mountain':
            yOffset = 0.8 // mountains
            break
          case 'elevationType:snowMountain':
            yOffset = 1 // snowy peaks
            break
          case 'elevationType:flat':
          default:
            yOffset = 0 // ground level
        }
      }

      for (const rIdx of repIndices) {
        const wx = baseWx + rIdx * periodX
        const inst = terrainMesh.createInstance(tile.key)
        // Instances are independent nodes; parent them to the common root for lifecycle.
        inst.parent = root
        inst.position = new Vector3(wx, yOffset, wz)
      }
    }
  }

  dispose (): LogicMeshBuilder {
    this.mesh?.dispose()

    return this
  }

  getMesh (): Mesh | null {
    return this.mesh
  }
}