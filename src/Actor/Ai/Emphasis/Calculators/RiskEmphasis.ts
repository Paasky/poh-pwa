import { CategoryEmphasis, Locality } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";

export class RiskEmphasis {
  constructor(
    private readonly player: Player,
    private readonly locality: Locality,
  ) {}

  calculate(): CategoryEmphasis {
    // Enemy Military

    // Our Value Tiles

    // Tension

    return {} as CategoryEmphasis;
  }
}
