import { Manager } from '@/managers/_manager'
import { Government, Player } from '@/objects/gameObjects'
import { Yields } from '@/types/common'

export class GovernmentManager extends Manager {
  calcSelectable (player: Player) {
    player.government.selectablePolicies = this._objects.getClassTypes('policyType')
      .filter(p => p.requires.isSatisfied(player.research.researched))
  }

  calcStatic (government: Government): void {
    government.specials = government.policies.flatMap(
      p => p.specials.map(
        s => this._objects.getTypeObject(s)
      )
    )
    government.yields = new Yields(government.policies.flatMap(
      p => p.yields.all()
    ))
  }

  startTurn () {

  }
}