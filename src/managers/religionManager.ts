import { Manager } from '@/managers/_manager'
import { City, Player, Religion } from '@/objects/gameObjects'
import { TypeObject } from '@/types/typeObjects'
import { Yields } from '@/types/common'

export class ReligionManager extends Manager {
  calcSelectable (religion: Religion) {
    const myths = [] as TypeObject[]
    const gods = [] as TypeObject[]
    const dogmas = [] as TypeObject[]

    // Run checks if the religion's holy city owner has it as the state religion
    const city = this._objects.getGameObject(religion.city) as City
    const owner = this._objects.getGameObject(city.player) as Player
    if (owner.religion === religion.key) {
      // todo check religion status & already selected myths/gods/dogmas
    }

    religion.selectableMyths = myths
    religion.selectableGods = gods
    religion.selectableDogmas = dogmas
  }

  calcStatic (religion: Religion): void {
    religion.yields = new Yields([
      ...religion.myths.flatMap(
        m => m.yields.all()
      ),
      ...religion.gods.flatMap(
        g => g.yields.all()
      ),
      ...religion.dogmas.flatMap(
        d => d.yields.all()
      ),
    ])
  }

  startTurn () {

  }
}