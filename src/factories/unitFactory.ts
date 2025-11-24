import { generateKey, Player, Tile, Unit, UnitDesign } from '@/objects/gameObjects'

export const createUnit = (
  player: Player,
  unitDesign: UnitDesign,
  tile: Tile,
): Unit => {
  const unit = new Unit(
    generateKey('unit'),
    player.key,
    unitDesign.key,
    tile.key,
  )

  player.unitKeys.value.push(unit.key)
  unitDesign.unitKeys.value.push(unit.key)
  tile.unitKeys.value.push(unit.key)

  return unit
}