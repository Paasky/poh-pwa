import { Diplomacy } from "@/Common/Objects/Diplomacy";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { IMutation } from "@/Common/IMutation";

export class DiplomacyStartTurn implements ISimAction {
  constructor (private diplomacy: Diplomacy) {}

  validateAction (): this {
    return this;
  }

  handleAction (): IMutation<Diplomacy>[] {
    return [];
  }
}