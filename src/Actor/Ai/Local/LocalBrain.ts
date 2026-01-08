import { Player } from "@/Common/Models/Player";
import { Locality, Note, Priority } from "@/Actor/Ai/AiTypes";
import { IBrain } from "@/Actor/Ai/Common/IBrain";

export class LocalBrain implements IBrain {
  constructor(
    public readonly player: Player,
    public readonly locality: Locality,
  ) {}

  act (priorities: Priority[]): Note[] {
    return [];
  }

  analyze (): Note[] {
    return [];
  }
}