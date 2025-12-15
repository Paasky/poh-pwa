import { type Construction } from "@/objects/game/Construction";
import { PohEvent } from "@/events/_Event";
import { TypeObject } from "@/types/typeObjects";
import { City } from "@/objects/game/City";
import { Player } from "@/objects/game/Player";
import { Tile } from "@/objects/game/Tile";
import { typeObjWithArticle } from "@/helpers/textTools";

export class ConstructionAbandoned extends PohEvent {
  constructor(construction: Construction, reason: string) {
    super(`${typeObjWithArticle(construction.type)} has been abandoned`);

    this.typeObj = construction.type;
    this.subject = construction;
    this.city = construction.city.value;
    this.tile = construction.tile.value;
    this.reason = reason;
  }
}

export class ConstructionCancelled extends PohEvent {
  constructor(typeObj: TypeObject, player: Player, tile: Tile, city?: City | null) {
    super(`cancelled ${typeObjWithArticle(typeObj)}`);

    this.typeObj = typeObj;
    this.player = player;
    this.tile = tile;
    this.city = city;
  }
}

export class ConstructionCompleted extends PohEvent {
  constructor(construction: Construction, player: Player) {
    super(`completed ${typeObjWithArticle(construction.type)}`);

    this.typeObj = construction.type;
    this.subject = construction;
    this.player = player;
    this.tile = construction.tile.value;
    this.city = construction.city.value;
  }
}

export class ConstructionLost extends PohEvent {
  constructor(typeObj: TypeObject, player: Player, tile: Tile, city?: City | null) {
    super(`lost the race to build ${typeObjWithArticle(typeObj)}`);

    this.typeObj = typeObj;
    this.player = player;
    this.tile = tile;
    this.city = city;
  }
}
