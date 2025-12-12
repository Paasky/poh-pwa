import { tileCenter } from '@/helpers/math'
import { Coords, tileHeight } from '@/helpers/mapTools'
import type { GameKey } from '@/objects/game/_GameObject'
import type { Tile } from '@/objects/game/Tile'
import type { WorldState } from '@/types/common'
import { Matrix, Mesh, Quaternion, Scene, TransformNode, Vector3 } from '@babylonjs/core'
import { FeatureGroup, featureMeshMap } from '@/assets/meshes/features'

export default class FeatureInstancer {
  scene: Scene
  size: Coords
  isVisible = true

  root: TransformNode
  lib: Record<FeatureGroup, { mesh: Mesh, indices: Record<GameKey, number> }>

  constructor (
    scene: Scene,
    world: WorldState,
    tiles: Tile[],
    parent: TransformNode,
  ) {
    this.scene = scene
    this.size = { x: world.sizeX, y: world.sizeY }
    this.root = new TransformNode('featuresRoot', this.scene)
    this.root.parent = parent

    this.lib = {} as Record<FeatureGroup, { mesh: Mesh, indices: Record<GameKey, number> }>
    for (const featureGroup of Object.keys(featureMeshMap) as FeatureGroup[]) {
      const getMesh = featureMeshMap[featureGroup]
      const mesh = getMesh(this.scene)
      mesh.setEnabled(false)
      mesh.parent = this.root
      mesh.isPickable = false

      this.lib[featureGroup] = {
        mesh,
        indices: {},
      }
    }

    // Initial full build for forests using SPS
    this.set(tiles)

    return this
  }

  setIsVisible (isVisible: boolean): this {
    this.isVisible = isVisible
    this.root.setEnabled(isVisible)
    return this
  }

  public set (tiles: Tile[]): this {
    const tilesPerGroup = {
      'pineTree': [],
      'leafTree': [],
      'jungleTree': [],
      'palmTree': [],
      'bush': [],
      'kelp': [],
      'ice': [],
      'atoll': [],
      // todo support once done 'floodPlain'
      // todo support once done 'swamp'
      // todo support once done 'lagoon'
      // todo support once done 'tradeWind'
    } as Record<FeatureGroup, Tile[]>

    for (const tile of tiles) {
      const featureGroup = this.getFeatureGroup(tile)
      if (!featureGroup) continue
      tilesPerGroup[featureGroup].push(tile)
    }

    for (const featureGroup of Object.keys(tilesPerGroup) as FeatureGroup[]) {
      const groupTiles = tilesPerGroup[featureGroup]
      const lib = this.lib[featureGroup]

      // Reset indices for this batch
      lib.indices = {}

      if (groupTiles.length === 0) {
        // Clear thin instances and hide mesh
        lib.mesh.thinInstanceSetBuffer('matrix', new Float32Array(0), 16)
        lib.mesh.isVisible = false
        lib.mesh.setEnabled(false)
        continue
      }

      // Build instance matrices (4x4 per instance)
      const count = groupTiles.length
      const stride = 16
      const data = new Float32Array(count * stride)

      const scale = Vector3.One()
      const rotation = Quaternion.Identity()
      const m = new Matrix()

      for (let i = 0; i < count; i++) {
        const tile = groupTiles[i]
        lib.indices[tile.key] = i
        const c = tileCenter(this.size, tile)
        const y = tileHeight(tile, true)
        Matrix.ComposeToRef(scale, rotation, new Vector3(c.x, y, c.z), m)
        m.copyToArray(data, i * stride)
      }

      lib.mesh.thinInstanceSetBuffer('matrix', data, stride, true)
      // Ensure the source mesh is actually rendered (isVisible was false in factories)
      lib.mesh.isVisible = this.isVisible
      lib.mesh.setEnabled(this.isVisible)
      // Refresh bounds so thin instances aren’t culled by the tiny source bounds
      const maybeTI = lib.mesh as unknown as { thinInstanceRefreshBoundingInfo?: (force?: boolean) => void }
      maybeTI.thinInstanceRefreshBoundingInfo?.(true)
    }

    return this
  }

  dispose (): void {
    for (const lib of Object.values(this.lib)) {
      lib.mesh.dispose(false, true)
    }
    this.root.dispose(false, true)
  }

  private getFeatureGroup (tile: Tile): FeatureGroup | null {
    if (tile.feature.value?.id === 'pineForest') return 'pineTree'
    if (tile.feature.value?.id === 'forest') return 'leafTree'
    if (tile.feature.value?.id === 'jungle') return 'jungleTree'
    if (tile.feature.value?.id === 'shrubs') return 'bush'
    if (tile.feature.value?.id === 'oasis') return 'palmTree'
    if (tile.feature.value?.id === 'floodPlain') return null
    if (tile.feature.value?.id === 'swamp') return null
    if (tile.feature.value?.id === 'ice') return 'ice'
    if (tile.feature.value?.id === 'kelp') return 'kelp'
    if (tile.feature.value?.id === 'lagoon') return null
    if (tile.feature.value?.id === 'atoll') return 'atoll'
    if (tile.feature.value?.id === 'tradeWind') return null
    return null
  }

  // Thin instances do not require per-group initialization helpers
}
