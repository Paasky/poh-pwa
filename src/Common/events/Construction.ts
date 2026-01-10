import { type Construction } from "@/Common/Models/Construction";
import { PohEvent } from "@/Common/events/_Event";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { City } from "@/Common/Models/City";
import { Player } from "@/Common/Models/Player";
import { Tile } from "@/Common/Models/Tile";
import { typeObjWithArticle } from "@/Common/Helpers/textTools";

export class ConstructionAbandoned extends PohEvent {
  constructor(construction: Construction, reason: string) {
    super(`${typeObjWithArticle(construction.type)} has been abandoned`);

    this.typeObj = construction.type;
    this.subject = construction;
    this.city = construction.city;
    this.tile = construction.tile;
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
    this.tile = construction.tile;
    this.city = construction.city;
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
