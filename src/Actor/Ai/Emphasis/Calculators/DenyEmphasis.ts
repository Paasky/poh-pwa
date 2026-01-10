import { CategoryEmphasis, Locality } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";

export class DenyEmphasis {
  constructor(
    private readonly player: Player,
    private readonly locality: Locality,
  ) {}

  calculate(): CategoryEmphasis {
    // Enemy Agenda

    // Enemy Value Tiles

    // Chokepoints

    return {} as CategoryEmphasis;
  }
}
