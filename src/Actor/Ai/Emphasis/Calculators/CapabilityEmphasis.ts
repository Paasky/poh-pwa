import { CategoryEmphasis, Locality } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";

export class CapabilityEmphasis {
  constructor(
    private readonly player: Player,
    private readonly locality: Locality,
  ) {}

  calculate(): CategoryEmphasis {
    // Our Military

    // Our Agents

    // Our Culture

    // Our Faith

    return {} as CategoryEmphasis;
  }
}
