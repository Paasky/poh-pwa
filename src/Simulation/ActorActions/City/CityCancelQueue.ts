import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { Player } from "@/Common/Models/Player";
import { City } from "@/Common/Models/City";
import { PohMutation } from "@/Common/PohMutation";
import { Queue } from "@/Common/Objects/Queues";

export class CityCancelQueue implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly city: City,
    private readonly queue: Queue,
    private readonly index: number,
  ) {}

  validateAction(): this {
    return this;
  }

  handleAction(): PohMutation[] {
    return [];
  }
}
