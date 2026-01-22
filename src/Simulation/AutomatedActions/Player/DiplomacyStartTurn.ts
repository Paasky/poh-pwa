import { Diplomacy } from "@/Common/Objects/Diplomacy";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { PohMutation } from "@/Common/PohMutation";

export class DiplomacyStartTurn implements ISimAction {
  constructor(private diplomacy: Diplomacy) {}

  validateAction(): this {
    return this;
  }

  handleAction(): PohMutation<Diplomacy>[] {
    return [];
  }
}
