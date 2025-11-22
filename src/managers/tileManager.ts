import { Manager } from '@/managers/_manager'
import { Building, City, Culture, Improvement, NationalWonder, Player, Tile, WorldWonder } from '@/types/gameObjects'
import { Yields } from '@/types/common'
import { CultureManager } from '@/managers/cultureManager'
import { TypeObject } from '@/types/typeObjects'

export class TileManager extends Manager {
  calcStatic (tile: Tile): void {
    this.calcYields(tile)
  }

  calcYields (tile: Tile) {
    const player = tile.player
      ? this._objects.getGameObject(tile.player) as Player
      : null

    tile.yields = new Yields([
      ...tile.terrain.yields.all(),
      ...tile.elevation.yields.all(),
      ...tile.feature?.yields.all() ?? [],
      ...tile.resource?.yields.all() ?? [],
      ...tile.pollution?.yields.all() ?? [],
      ...player?.yieldMods.all() ?? [],
    ])
  }

  discover (tile: Tile, player: Player) {
    if (player.knownTiles.includes(tile.key)) throw new Error(`${tile.key} already known to ${player.key}`)

    player.knownTiles.push(tile.key)
    const culture = this._objects.getGameObject(player.culture) as Culture
    if (culture.status === 'notSettled' || culture.status === 'settled') {
      const cultureManager = new CultureManager()
      const tileTypes = [
        tile.terrain,
        tile.elevation,
        tile.feature,
        tile.resource,
      ].filter(t => !!t) as TypeObject[]

      // Find all heritage categories to give points for
      for (const heritage of this._objects.getClassTypes('heritageType')) {
        if (heritage.requires.isSatisfied(tileTypes)) {
          cultureManager.addHeritagePoints(
            culture,
            heritage.category!,
            heritage.yields.getLumpAmount('yieldType:heritagePoints')
          )
        }
      }
    }
  }

  startTurn (tile: Tile) {
    // Abandoned construction will degrade over time
    if (tile.construction && !tile.citizens.length) {
      const construction = this._objects.getGameObject(tile.construction) as Building | City | Improvement | NationalWonder | WorldWonder
      if (construction.health > 0) {
        construction.health = Math.max(0, construction.health - 5)
      }
    }
  }
}