import { Player } from "@/Common/Models/Player";
import { Note, Priority } from "@/Actor/Ai/AiTypes";
import { IBrain } from "@/Actor/Ai/Common/IBrain";

export class StrategicBrain implements IBrain {
  public readonly notes: Note[] = [];

  constructor(public readonly player: Player) {}

  act (priorities: Priority[]): Note[] {
    return [];
  }

  analyze (): Note[] {
    return [];
  }
}