import { Priority } from "@/Actor/Ai/AiTypes";
import { City } from "@/Common/Models/City";
import { Construction } from "@/Common/Models/Construction";
import { Tile } from "@/Common/Models/Tile";
import { Unit } from "@/Common/Models/Unit";

export function chooseAttackTarget(
  object: City | Unit,
  priority?: Priority,
): City | Construction | Tile | Unit {
  // todo
}

export function chooseBombardTarget(
  object: City | Unit,
  priority?: Priority,
): City | Construction | Tile | Unit {
  // todo
}

export function chooseMoveTo(unit: Unit, priority?: Priority): Tile {
  // todo
}
