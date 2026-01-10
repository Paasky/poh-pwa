import { PohEvent } from "@/Common/events/_Event";
import { Religion } from "@/Common/Models/Religion";
import { TypeObject } from "@/Common/Objects/TypeObject";

export class ReligionCanSelect extends PohEvent {
  constructor(religion: Religion) {
    super(`select new ${religion.status} for ${religion.name}`);

    this.subject = religion;
    this.player = religion.city.player;
  }
}

export class ReligionHasEvolved extends PohEvent {
  constructor(religion: Religion) {
    super(`evolved ${religion.name} to ${religion.status}`);

    this.subject = religion;
    this.player = religion.city.player;
  }
}

export class ReligionHasNewType extends PohEvent {
  constructor(religion: Religion, type: TypeObject) {
    super(`selected ${type.name} for ${religion.name}`);

    this.subject = religion;
    this.typeObj = type;
    this.player = religion.city.player;
  }
}
