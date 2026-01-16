import { GameKey, GameObjAttr, GameObject } from "./_GameModel";
import type { Player } from "./Player";
import { playerYieldTypeKeys, Yield, Yields } from "../Static/Objects/Yields";
import { TypeObject } from "../Static/Objects/TypeObject";

export class Incident extends GameObject {
  constructor(
    key: GameKey,
    public playerKey: GameKey,
  ) {
    super(key);
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
  get player(): Player {
    return this.hasOne<Player>("playerKey");
  }

  /*
   * Computed
   */

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "yields",
      () => {
        const yieldsForMe = (yields: Yields): Yield[] => {
          return yields.only(playerYieldTypeKeys, new Set<TypeObject>([this.concept])).all();
        };

        // Incident Yields are just From Actor Mods
        const yields = new Yields();
        yields.add(...yieldsForMe(this.player.yieldMods));

        // Flatten Yields to apply modifiers
        return yields.flatten();
      },
      {
        relations: [{ relName: "player", relProps: ["yieldMods"] }],
      },
    );
  }

  /*
   * Actions
   */
  // todo add here
}
