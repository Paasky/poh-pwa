import { type Citizen } from "@/objects/game/Citizen";
import { PohEvent } from "@/events/_Event";
import { City } from "@/objects/game/City";
import { Player } from "@/objects/game/Player";
import { Tile } from "@/objects/game/Tile";

export class CitizenGained extends PohEvent {
  subject: Citizen;
  city: City;
  player: Player;
  tile: Tile;
  reason: string;

  constructor(citizen: Citizen, reason: string) {
    super("gained a new citizen");

    this.subject = citizen;
    this.city = citizen.city.value;
    this.player = citizen.city.value.player.value;
    this.tile = citizen.tile.value;
    this.reason = reason;
  }
}

export class CitizenLost extends PohEvent {
  city: City;
  player: Player;
  tile: Tile;
  reason: string;

  constructor(city: City, tile: Tile, reason: string, subject?: Citizen) {
    super("lost a citizen");

    this.city = city;
    this.player = city.player.value;
    this.tile = tile;
    this.reason = reason;
    this.subject = subject;
  }
}
