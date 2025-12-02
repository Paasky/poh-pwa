import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import type { Player } from "@/objects/game/Player";
import { hasOne } from "@/objects/game/_relations";
import { ComputedRef } from "vue";

export class Agenda extends GameObject {
  constructor(key: GameKey, playerKey: GameKey) {
    super(key);

    this.playerKey = playerKey;
    this.player = hasOne<Player>(this.playerKey, `${this.key}.player`);
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "playerKey", attrNotRef: true, related: { theirKeyAttr: "agendaKeys" } },
  ];

  /*
   * Attributes
   */
  // todo add here

  /*
   * Relations
   */
  playerKey: GameKey;
  player: ComputedRef<Player>;

  /*
   * Computed
   */
  // todo add here

  /*
   * Actions
   */
  // todo add here
}
