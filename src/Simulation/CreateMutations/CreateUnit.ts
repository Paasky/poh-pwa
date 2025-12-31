import { Player } from "@/Common/Models/Player";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { Tile } from "@/Common/Models/Tile";
import { Unit } from "@/Common/Models/Unit";
import { IMutation } from "@/Common/IMutation";
import { generateKey } from "@/Common/Models/_GameTypes";

export class CreateUnit {
  constructor(
    private readonly player: Player,
    private readonly design: UnitDesign,
    private readonly props?: Partial<Unit>,
  ) {}

  create(tile: Tile): IMutation {
    return {
      type: "create",
      payload: {
        key: generateKey("unit"),
        designKey: this.design.key,
        playerKey: this.player.key,
        tileKey: tile.key,
        ...this.props,
      } as Partial<Unit>,
    };
  }
}
