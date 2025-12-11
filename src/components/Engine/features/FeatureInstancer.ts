import { tileCenter } from '@/helpers/math'
import { Coords, tileHeight } from '@/helpers/mapTools'
import type { GameKey } from '@/objects/game/_GameObject'
import type { Tile } from '@/objects/game/Tile'
import type { WorldState } from '@/types/common'
import { Mesh, Scene, TransformNode, } from '@babylonjs/core'
import { SolidParticleSystem } from '@babylonjs/core/Particles/solidParticleSystem'
import { FeatureGroup, featureMeshMap } from '@/assets/meshes/features'

export default class FeatureInstancer {
  scene: Scene
  size: Coords
  isVisible = true

  root: TransformNode
  baseMeshContainer: TransformNode
  lib: Record<FeatureGroup, { mesh: Mesh, sps: SolidParticleSystem, indices: Record<GameKey, number> }>

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

    this.baseMeshContainer = new TransformNode('featuresBase', this.scene)
    this.baseMeshContainer.setEnabled(false)
    this.lib = {} as any
    for (const [featureGroup, getMesh] of Object.entries(featureMeshMap)) {
      const mesh = getMesh(this.scene)
      mesh.setEnabled(false)
      mesh.parent = this.baseMeshContainer

      this.lib[featureGroup as FeatureGroup] = {
        mesh,
        sps: this.initSps(featureGroup as FeatureGroup),
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

    for (const [featureGroup, tiles] of Object.entries(tilesPerGroup)) {
      const lib = this.lib[featureGroup as FeatureGroup]

      // Make our life much easier: reset the sps and indices before each batch
      if (lib.sps.nbParticles > 0) {
        lib.sps.dispose()
        lib.sps = this.initSps(featureGroup as FeatureGroup)
      }

      // Nothing to draw for this group
      if (tiles.length === 0) {
        lib.indices = {}
        continue
      }

      // Add the base mesh
      lib.sps.addShape(lib.mesh, tiles.length)

      // Build and attach the SPS mesh
      const meshNode = lib.sps.buildMesh()
      meshNode.parent = this.root
      meshNode.isPickable = false

      // Set update-function for tile <-> particle -> index <-> position
      lib.sps.updateParticle = (p) => {
        const tile = tiles[p.idx]

        lib.indices[tile.key] = p.idx

        const center = tileCenter(this.size, tile)
        p.position.set(center.x, tileHeight(tile, true), center.z)

        return p
      }
      lib.sps.setParticles()
    }

    return this
  }

  dispose (): void {
    for (const lib of Object.values(this.lib)) {
      lib.sps.dispose()
      lib.mesh.dispose(false, true)
    }
    this.baseMeshContainer.dispose(false, true)
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

  private initSps (featureGroup: FeatureGroup): SolidParticleSystem {
    return new SolidParticleSystem(
      `features.${featureGroup}SPS`,
      this.scene,
      { updatable: false }
    )
  }
}
