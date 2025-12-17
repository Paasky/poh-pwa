import { type Unit } from "@/objects/game/Unit";
import { PohEvent } from "@/events/_Event";
import { City } from "@/objects/game/City";
import { Tile } from "@/objects/game/Tile";
import { Player } from "@/objects/game/Player";
import { aWord } from "@/helpers/textTools";

export class UnitAttacked extends PohEvent {
  constructor(unit: Unit) {
    super(`attacked ${aWord(unit.name.value)}`);

    this.subject = unit;
    this.player = unit.player.value;
    this.tile = unit.tile.value;
  }
}

export class UnitCreated extends PohEvent {
  constructor(unit: Unit) {
    super(`gained ${aWord(unit.name.value)}`);

    this.subject = unit;
    this.city = unit.city.value;
    this.player = unit.player.value;
    this.tile = unit.tile.value;
  }
}

export class UnitHealed extends PohEvent {
  constructor(unit: Unit) {
    super(`healed ${aWord(unit.name.value)}`);

    this.subject = unit;
    this.player = unit.player.value;
    this.tile = unit.tile.value;
  }
}

export class UnitInDanger extends PohEvent {
  constructor(unit: Unit) {
    super(`${aWord(unit.name.value)} in danger`);

    this.subject = unit;
    this.player = unit.player.value;
    this.tile = unit.tile.value;
  }
}

export class UnitLost extends PohEvent {
  constructor(name: string, player: Player, tile: Tile, reason: string, city?: City | null) {
    super(`lost ${aWord(name)}`);

    this.player = player;
    this.tile = tile;
    this.reason = reason;
    this.city = city;
  }
}
