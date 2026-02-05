import { CategoryEmphasis, Locality } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";

export class CapabilityEmphasis {
  constructor(
    private readonly player: Player,
    private readonly locality: Locality,
  ) {}

  calculate(): CategoryEmphasis {
    // Our Military
    // - if no enemy military units: 20p per unit
    // - else use our combined military unit production cost vs others: 0: <= 1:2, 50: 1:1, 100: >= 2:1

    // Our Agents
    // - if no enemy agent units: 20p per unit
    // - else use our combined agent unit production cost vs others: 0: <= 1:2, 50: 1:1, 100: >= 2:1

    // Our Culture
    // - if no other culture citizens: 20p per citizen
    // - else use our culture citizen count vs other cultures count: 0: <= 1:2, 50: 1:1, 100: >= 2:1

    // Our Faith
    // - if no other faith citizens: 20p per citizen
    // - else use our faith citizen count vs other faiths count: 0: <= 1:2, 50: 1:1, 100: >= 2:1

    return {} as CategoryEmphasis;
  }
}
