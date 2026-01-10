import { PohEvent } from "@/Common/events/_Event";
import { Player } from "@/Common/Models/Player";
import { City } from "@/Common/Models/City";

export class CityAttacked extends PohEvent {
  constructor(city: City, player: Player) {
    super(`attacked ${city.name}`);

    this.subject = city;
    this.tile = city.tile;
    this.player = player;
  }
}

export class CityCaptured extends PohEvent {
  constructor(city: City, player: Player) {
    super(`captured ${city.name}`);

    this.subject = city;
    this.tile = city.tile;
    this.player = player;
  }
}

export class CityLiberated extends PohEvent {
  constructor(city: City, player: Player) {
    super(`captured ${city.name}`);

    this.subject = city;
    this.tile = city.tile;
    this.player = player;
  }
}

export class CitySettled extends PohEvent {
  constructor(city: City, player: Player) {
    super(`settled ${city.name}`);

    this.subject = city;
    this.tile = city.tile;
    this.player = player;
  }
}
