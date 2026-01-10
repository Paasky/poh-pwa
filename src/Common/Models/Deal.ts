import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import type { Player } from "@/Common/Models/Player";
import { playerYieldTypeKeys, Yield, Yields } from "@/Common/Static/Yields";
import { TypeObject } from "@/Common/Objects/TypeObject";

export class Deal extends GameObject {
  constructor(
    key: GameKey,
    public fromPlayerKey: GameKey,
    public toPlayerKey: GameKey,
  ) {
    super(key);
  }

  static attrsConf: GameObjAttr[] = [
    {
      attrName: "fromPlayerKey",
      related: { theirKeyAttr: "dealKeys" },
    },
    {
      attrName: "toPlayerKey",
      related: { theirKeyAttr: "dealKeys" },
    },
  ];

  /*
   * Attributes
   */
  // todo add here

  /*
   * Relations
   */
  get fromPlayer(): Player {
    return this.hasOne<Player>("fromPlayerKey");
  }
  get toPlayer(): Player {
    return this.hasOne<Player>("toPlayerKey");
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

        // Deal Yields are just From Actor Mods
        const yields = new Yields();
        yields.add(...yieldsForMe(this.fromPlayer.yieldMods));

        // Flatten Yields to apply modifiers
        return yields.flatten();
      },
      {
        relations: [{ relName: "fromPlayer", relProps: ["yieldMods"] }],
      },
    );
  }

  /*
   * Actions
   */
  // todo add here
}
