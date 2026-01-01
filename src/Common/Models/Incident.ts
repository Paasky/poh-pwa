import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import type { Player } from "@/Common/Models/Player";
import { hasOne } from "@/Common/Models/_Relations";
import { playerYieldTypeKeys, Yield, Yields } from "@/Common/Objects/Yields";
import { TypeObject } from "@/Common/Objects/TypeObject";

export class Incident extends GameObject {
  constructor(
    key: GameKey,
    public playerKey: GameKey,
  ) {
    super(key);

    hasOne<Player>(this, "playerKey");
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "playerKey", related: { theirKeyAttr: "incidentKeys" } },
  ];

  /*
   * Attributes
   */
  // todo add here

  /*
   * Relations
   */
  declare player: Player;

  /*
   * Computed
   */

  // My Yield output
  get yields(): Yields {
    return this.computed("_yields", () => {
      const yieldsForMe = (yields: Yields): Yield[] => {
        return yields.only(playerYieldTypeKeys, new Set<TypeObject>([this.concept])).all();
      };

      // Incident Yields are just From Player Mods
      const yields = new Yields();
      yields.add(...yieldsForMe(this.player.yieldMods));

      // Flatten Yields to apply modifiers
      return yields.flatten();
    });
  }

  /*
   * Actions
   */
  // todo add here
}
