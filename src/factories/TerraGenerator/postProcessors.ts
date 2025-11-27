import { getRandom } from '@/helpers/arrayTools'
import { snake } from '@/factories/TerraGenerator/snake'
import { useObjectsStore } from '@/stores/objectStore'
import { GenTile } from '@/factories/TerraGenerator/terraGenerator'

export const removeOrphanArea = (
  tile: GenTile,
  neighbors: GenTile[]
) => {
  if (neighbors.length === 0) return

  // If any neighbor has the same area, or all are a different domain (I'm a lake/island)
  // -> skip
  const hasSameArea = neighbors.some(n => n.area.key === tile.area.key)
  const allDiffDomain = neighbors.every(n => n.domain !== tile.domain)
  if (hasSameArea || allDiffDomain) return

  const ref = getRandom(neighbors)
  // If the domain changes, also change climate and terrain
  if (tile.domain !== ref.domain && tile.canChangeDomain()) {
    tile.domain = ref.domain
    tile.climate = ref.climate
    tile.terrain = ref.terrain
  }
  tile.area = ref.area
}

export const removeOrphanTerrain = (
  tile: GenTile,
  neighbors: GenTile[]
) => {
  if (neighbors.length === 0) return

  // If any neighbor has the same area, or all are a different area (I'm a lake/island)
  // -> skip
  const hasSameTerrain = neighbors.some(n => n.terrain.key === tile.terrain.key)
  const allDiffArea = neighbors.every(n => n.area.key !== tile.area.key)
  if (hasSameTerrain || allDiffArea) return

  const ref = getRandom(neighbors)
  // If the domain changes, also change the area
  if (ref.domain !== tile.domain) {
    if (!tile.canChangeDomain()) return
    tile.area = ref.area
  }
  tile.domain = ref.domain
  tile.climate = ref.climate
  tile.terrain = ref.terrain
}

export const mountainRange = (
  start: GenTile,
  tiles: Record<string, GenTile>,
  size: { x: number, y: number }
) => {
  const flat = useObjectsStore().getTypeObject('elevationType:flat')
  const mountain = useObjectsStore().getTypeObject('elevationType:mountain')
  const snowMountain = useObjectsStore().getTypeObject('elevationType:snowMountain')

  const walkedTiles: GenTile[] = []
  let waterCount = 0
  snake(
    start,
    tiles,
    walkedTiles,
    size,
    [4, 5],
    [3, 4],
    (tile: GenTile): boolean => {
      if (tile.domain.id === 'water' && tile.terrain.id !== 'lake') {
        waterCount++
        return waterCount < 3
      }

      tile.elevation = tile.elevation === mountain || tile.elevation === snowMountain || Math.random() > 0.9 ? snowMountain : mountain
      return true
    }
  )
  return walkedTiles
}
