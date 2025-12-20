import { PohEvent } from "@/events/_Event";
import { Player } from "@/objects/game/Player";

export class PlayerDestroyed extends PohEvent {
  constructor(deadPlayer: Player, player: Player) {
    super(`destroyed ${deadPlayer.name}`);

    this.subject = deadPlayer;
    this.player = player;
  }
}

export class PlayerMet extends PohEvent {
  constructor(metPlayer: Player, player: Player) {
    super(`met ${metPlayer.name}`);

    this.subject = metPlayer;
    this.player = player;
  }
}
