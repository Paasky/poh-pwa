import { City, generateKey, Player, Tile, Unit, UnitDesign, UnitStatus } from '@/objects/gameObjects'
import { Manager } from '@/managers/_manager'

export class UnitManager extends Manager {
  create (
    player: Player,
    unitDesign: UnitDesign,
    tile: Tile,
    city?: City,
    status?: UnitStatus,
    moves?: number,
    health?: number,
  ): Unit {
    const unit = new Unit(
      generateKey('unit'),
      player.key,
      tile.key,
      unitDesign.key,
    )
    if (city) unit.cityKey.value = city.key
    if (status) unit.status.value = status
    if (moves !== undefined) unit.moves.value = moves
    if (health !== undefined) unit.health.value = health

    this._objects.set(unit)

    player.unitKeys.value.push(unit.key)

    return unit
  }

  calcTiles (player: Player): void {
  }

  resetMoves (unit: Unit): void {
    unit.moves.value = unit.design.value.equipment.moves!
  }
}
