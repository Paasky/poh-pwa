import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import type { Player } from "@/Common/Models/Player";
import { hasOne } from "@/Common/Models/_Relations";
import { playerYieldTypeKeys, Yield, Yields } from "@/Common/Objects/Yields";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { clamp } from "@/helpers/basicMath";
import { reduce } from "@/helpers/collectionTools";
import { roundToTenth } from "@/Common/Objects/Common";

export class Agenda extends GameObject {
  constructor(
    key: GameKey,
    public playerKey: GameKey,
  ) {
    super(key);

    hasOne<Player>(this, "playerKey");
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "playerKey", related: { theirKeyAttr: "agendaKeys" } },
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

        const totalInfluenceOutput = reduce(
          this.player.cities,
          (amount, city) => amount + city.yields.getLumpAmount("yieldType:influence"),
          0,
        );

        // Agenda Yields are 30% of Actor Influence (clamped 10-500) + Actor Mods
        const yields = new Yields([
          {
            type: "yieldType:influenceCost",
            amount: clamp(roundToTenth(totalInfluenceOutput * 0.3), 10, 500),
            method: "lump",
            for: new Set(),
            vs: new Set(),
          } as Yield,
        ]);

        yields.add(...yieldsForMe(this.player.yieldMods));

        // Flatten Yields to apply modifiers
        return yields.flatten();
      },
      { relations: [{ relName: "player", relProps: ["cities"] }] },
    );
  }

  /*
   * Actions
   */
  // todo add here
}
