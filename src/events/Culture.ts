import { PohEvent } from "@/events/_Event";
import { Culture } from "@/objects/game/Culture";
import { TypeObject } from "@/types/typeObjects";

export class CultureCanSelect extends PohEvent {
  constructor(culture: Culture) {
    const typeWord = culture.status.value === "settled" ? "traits" : "heritages";
    super(`select new ${typeWord} for ${culture.type.name}`);

    this.subject = culture;
    this.player = culture.player;
  }
}
export class CultureCanSettle extends PohEvent {
  constructor(culture: Culture) {
    super(`settle down`);

    this.subject = culture;
    this.player = culture.player;
  }
}

export class CultureHasSettled extends PohEvent {
  constructor(culture: Culture) {
    super(`settled down`);

    this.subject = culture;
    this.player = culture.player;
  }
}

export class CultureHasNewType extends PohEvent {
  constructor(culture: Culture, type: TypeObject) {
    super(`selected ${type.name} for ${culture.type.name}`);

    this.subject = culture;
    this.typeObj = type;
    this.player = culture.player;
  }
}
