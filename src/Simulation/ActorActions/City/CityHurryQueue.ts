import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { Player } from "@/Common/Models/Player";
import { City } from "@/Common/Models/City";
import { IMutation } from "@/Common/IMutation";
import { Queue } from "@/Common/Objects/Queues";

export class CityHurryQueue implements ISimAction {
  constructor(
    private readonly player: Player,
    private readonly city: City,
    private readonly queue: Queue,
  ) {}

  validateAction(): this {
    return this;
  }

  handleAction(): IMutation[] {
    return [];
  }
}
