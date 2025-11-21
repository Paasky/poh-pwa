import { Manager } from '@/managers/_manager'
import { Player } from '@/types/gameObjects'

export class GovernmentManager extends Manager {
  calcSelectable (player: Player) {
    const policies = []

    for (const policy of this._objects.getClassTypes('policyType')) {
      let hasAll = true
      for (const requireKey of policy.requires) {
        if (Array.isArray(requireKey)) {
          let hasAny = false
          for (const reqAnyKey of requireKey) {
            if (player.knownTypes.includes(this._objects.getTypeObject(reqAnyKey))) {
              hasAny = true
              break
            }
          }
          if (!hasAny) {
            hasAll = false
            break
          }
        } else {
          if (!player.knownTypes.includes(this._objects.getTypeObject(requireKey))) {
            hasAll = false
            break
          }
        }
      }
      if (hasAll) {
        policies.push(policy)
      }
    }

    player.government.selectablePolicies = policies
  }

  startTurn () {

  }
}