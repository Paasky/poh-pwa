import { City, Player, Tile, Unit, UnitDesign } from '@/types/gameObjects'
import { createUnit } from '@/factories/unitFactory'
import { useObjectsStore } from '@/stores/objects'

export class UnitManager {
  private objects = useObjectsStore()

  create (
    player: Player,
    unitDesign: UnitDesign,
    tile: Tile,
    city?: City,
    moves?: number,
    health: number = 100,
    isLevy = false,
    isMercenary = false,
    isMobilized = false
  ): Unit {
    return createUnit(
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
  }

  getDesign (unit: Unit): UnitDesign {
    return this.objects.getGameObject(unit.design) as UnitDesign
  }

  resetMoves (unit: Unit) {
    unit.moves = this.getDesign(unit).equipment.moves!
  }
}
