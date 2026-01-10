import { CategoryEmphasis, Locality } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";

export class RewardEmphasis {
  constructor(
    private readonly player: Player,
    private readonly locality: Locality,
  ) {}

  calculate(): CategoryEmphasis {
    // Unknown Tiles

    // Our Agenda

    // Wonders Available

    return {} as CategoryEmphasis;
  }
}
