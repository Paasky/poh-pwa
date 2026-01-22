import { City } from "@/Common/Models/City";
import { Priority } from "@/Actor/Ai/AiTypes";
import {
  CancelConstruction,
  CancelTraining,
  HurryConstruction,
  HurryTraining,
  OrderConstruction,
  OrderTraining,
  StartConstruction,
  StartTraining,
} from "@/Common/PohAction";

export function setToConstruct(
  city: City,
  priority?: Priority,
): (StartConstruction | OrderConstruction | HurryConstruction | CancelConstruction)[] {
  // todo
}

export function setToTrain(
  city: City,
  priority?: Priority,
): (StartTraining | OrderTraining | HurryTraining | CancelTraining)[] {
  // todo
}
