import { PohEvent } from "@/events/_Event";
import { Player } from "@/objects/game/Player";
import { Tile } from "@/objects/game/Tile";

export class AreaDiscovered extends PohEvent {
  constructor(tile: Tile, player: Player) {
    super(`discovered ${tile.area.name}`);

    this.subject = tile;
    this.typeObj = tile.area;
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

export class WonderDiscovered extends PohEvent {
  constructor(tile: Tile, player: Player) {
    super(`discovered ${tile.construction.value!.type.name}`);

    this.subject = tile;
    this.typeObj = tile.construction.value!.type;
    this.player = player;
  }
}
