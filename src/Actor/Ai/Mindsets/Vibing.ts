import { Difficulty, Priority, Region } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";
import { IMindset } from "@/Actor/Ai/Mindsets/_IMindset";
import { Memory } from "@/Actor/Ai/Memory";
import { PohEvent } from "@/Common/PohEvent";

// No specific plans or threats, just vibing!
export class Vibing implements IMindset {
  constructor(
    public readonly player: Player,
    public readonly difficulty: Difficulty,
    public readonly memory: Memory,
    public readonly regions: Set<Region>,
  ) {}

  analyzeStrategy(events: PohEvent[]): Priority[] {
    // todo

    return [];
  }
}
