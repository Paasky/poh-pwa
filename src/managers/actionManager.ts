import { Manager } from '@/managers/_manager'
import { Tile, Unit } from '@/types/gameObjects'
import { TypeObject } from '@/types/typeObjects'

export class ActionManager extends Manager {
  attack (unit: Unit, target: Tile | Unit) {

  }

  bombard (unit: Unit, target: Tile | Unit) {

  }

  build (unit: Unit, improvement: TypeObject) {

  }

  claim (unit: Unit) {

  }

  clean (unit: Unit) {

  }

  explore (unit: Unit) {

  }

  fortify (unit: Unit) {

  }

  heal (unit: Unit) {

  }

  move (unit: Unit, to: Tile) {

  }

  pillage (unit: Unit, tile: Tile) {

  }

  recon (unit: Unit, tile: Tile) {

  }

  repair (unit: Unit) {

  }

  settle (unit: Unit) {

  }

  teleport (unit: Unit, to: Tile) {

  }
}