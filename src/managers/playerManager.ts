import { Culture, Player, Religion, UnitDesign } from '@/types/gameObjects'
import { createPlayer, PlayerBundle } from '@/factories/playerFactory'
import { Manager } from '@/managers/_manager'
import { TypeObject } from '@/types/typeObjects'
import { Yields } from '@/types/common'

export class PlayerManager extends Manager {
  calcStatic (player: Player): void {
    this.calcKnownTypes(player)
    this.calcTiles(player)
    this.calcYields(player)

    /*
    new UnitManager().calcStatic(player)

    new DiplomacyManager().calcStatic(player)
    new GovernmentManager().calcStatic(player)
    new TechnologyManager().calcStatic(player)
    new UnitDesignManager().calcStatic(player)
    */
  }

  /*
   * Set all types the player has already researched
   */
  calcKnownTypes (player: Player): void {
    const knownTypes = []

    for (const type of this._objects.getAllTypes()) {
      // Only types that can be researched
      if (![
        'equipmentType',
        'improvementType',
        'nationalWonderType',
        'platformType',
        'policyType',
        'resourceType',
        'routeType',
        'stockpileType',
        'technologyType',
        'worldWonderType',
      ].includes(type.class)
      ) continue

      // If all required techs of the type are researched -> add to knownTypes
      if (type.requires.filter(['technologyType']).isSatisfied(player.research.researched)) {
        knownTypes.push(type)
      }
    }

    player.knownTypes = knownTypes
  }

  calcTiles (player: Player): void {
  }

  calcYields (player: Player): void {
    const culture = this._objects.getGameObject(player.culture) as Culture
    const religion = player.religion
      ? this._objects.getGameObject(player.religion) as Religion
      : null

    player.yields = new Yields([
      ...culture.yields.all(),
      ...religion?.yields.all() ?? [],
      ...player.government.yields.all(),
      ...player.research.yields.all(),
    ])
  }

  create (
    name: string,
    cultureType: TypeObject,
    isCurrent = false,
  ): Player {
    const playerBundle = createPlayer(name, cultureType, isCurrent) as PlayerBundle
    this._objects.bulkSet([playerBundle.player, playerBundle.culture])

    new PlayerManager().calcKnownTypes(playerBundle.player)

    return playerBundle.player
  }

  endTurn (player: Player): void {
  }

  getLevyUnit (player: Player): UnitDesign | null {
    const designs = player.unitDesigns
      .map(d => this._objects.getGameObject(d) as UnitDesign)
      .filter(d => d.specials.filter(s => s.id === 'canLevy').length > 0)

    return designs[0] ?? null
  }

  startTurn (player: Player): void {
  }
}