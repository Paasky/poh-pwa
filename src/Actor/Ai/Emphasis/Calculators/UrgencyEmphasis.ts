import { CategoryEmphasis, Locality } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";

export class UrgencyEmphasis {
  constructor(
    private readonly player: Player,
    private readonly locality: Locality,
  ) {}

  calculate(): CategoryEmphasis {
    // Tension

    // Siege

    // Diplomacy Timers

    return {} as CategoryEmphasis;
  }
}
