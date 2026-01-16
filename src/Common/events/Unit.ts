import { type Unit } from "../Models/Unit";
import { PohEvent } from "./_Event";
import { City } from "../Models/City";
import { Tile } from "../Models/Tile";
import { Player } from "../Models/Player";
import { aWord } from "../Helpers/textTools";

export class UnitAttacked extends PohEvent {
  constructor(unit: Unit) {
    super(`attacked ${aWord(unit.name.value)}`);

    this.subject = unit;
    this.player = unit.player;
    this.tile = unit.tile;
  }
}

export class UnitCreated extends PohEvent {
  constructor(unit: Unit) {
    super(`gained ${aWord(unit.name.value)}`);

    this.subject = unit;
    this.city = unit.city;
    this.player = unit.player;
    this.tile = unit.tile;
  }
}

export class UnitHealed extends PohEvent {
  constructor(unit: Unit) {
    super(`healed ${aWord(unit.name.value)}`);

    this.subject = unit;
    this.player = unit.player;
    this.tile = unit.tile;
  }
}

export class UnitInDanger extends PohEvent {
  constructor(unit: Unit) {
    super(`${aWord(unit.name.value)} in danger`);

    this.subject = unit;
    this.player = unit.player;
    this.tile = unit.tile;
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
