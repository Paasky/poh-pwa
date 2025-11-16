import { City, Player, Tile, Unit, UnitDesign } from '@/types/gameObjects'
import { createUnit } from '@/factories/unitFactory'
import { useObjectsStore } from '@/stores/objectStore'
import { Manager } from '@/managers/_manager'

export class UnitManager extends Manager {
  create (
    player: Player,
    unitDesign: UnitDesign,
    tile: Tile,
    city?: City,
    moves?: number,
    health: number = 100,
    isLevy = false,
    isMercenary = false,
    isMobilized = false,
  ): Unit {
    const unit = createUnit(
      player.key,
      unitDesign.key,
      tile.key,
      moves ?? unitDesign.equipment.moves!,
      isLevy,
      isMercenary,
      isMobilized,
      health,
      city?.key,
    )
    this._objects.set(unit)
    return unit
  }

  getDesign (unit: Unit): UnitDesign {
    return this._objects.getGameObject(unit.design) as UnitDesign
  }

  calcTiles(player: Player): void {
  }

  resetMoves (unit: Unit): void {
    unit.moves = this.getDesign(unit).equipment.moves!
  }
}
