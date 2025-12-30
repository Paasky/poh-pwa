import { canHaveOne, hasOne } from "@/Common/Models/_Relations";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { Yields } from "@/Common/Objects/Yields";
import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import type { City } from "@/Common/Models/City";
import type { Player } from "@/Common/Models/Player";
import type { Culture } from "@/Common/Models/Culture";
import type { Religion } from "@/Common/Models/Religion";
import type { Tile } from "@/Common/Models/Tile";
import { Construction } from "@/Common/Models/Construction";

export class Citizen extends GameObject {
  constructor(
    key: GameKey,
    public cityKey: GameKey,
    public cultureKey: GameKey,
    public playerKey: GameKey,
    public tileKey: GameKey,
    public religionKey: GameKey | null = null,
    public policy: TypeObject | null = null,
  ) {
    super(key);

    hasOne<City>(this, "cityKey");
    hasOne<Culture>(this, "cultureKey");
    hasOne<Player>(this, "playerKey");
    canHaveOne<Religion>(this, "religionKey");
    hasOne<Tile>(this, "tileKey");
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "cityKey", related: { theirKeyAttr: "citizenKeys" } },
    { attrName: "cultureKey", related: { theirKeyAttr: "citizenKeys" } },
    { attrName: "playerKey", related: { theirKeyAttr: "citizenKeys" } },
    { attrName: "tileKey", related: { theirKeyAttr: "citizenKeys" } },
    {
      attrName: "religionKey",
      isOptional: true,
      related: { theirKeyAttr: "citizenKeys" },
    },
    { attrName: "policy", isOptional: true, isTypeObj: true },
  ];

  /*
   * Attributes
   */

  /*
   * Relations
   */
  declare city: City;
  declare culture: Culture;
  declare player: Player;
  declare religion: Religion | null;
  declare tile: Tile;

  /*
   * Computed
   */
  get tileYields(): Yields {
    return this.tile.yields.only(this.concept.inheritYieldTypes!, [this.concept]);
  }

  get work(): Construction | null {
    return this.tile.construction;
  }

  get workYields(): Yields | null {
    return this.work?.yields.only(this.concept.inheritYieldTypes!, [this.concept]) ?? null;
  }

  get yields(): Yields {
    return new Yields([...this.tileYields.all(), ...(this.workYields?.all() ?? [])]);
  }
}
