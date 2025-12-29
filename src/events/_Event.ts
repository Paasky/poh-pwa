import { Player } from "@/Common/Models/Player";
import { Tile } from "@/Common/Models/Tile";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { City } from "@/Common/Models/City";
import { GameObject } from "@/Common/Models/_GameModel";
import { capitalize } from "@/helpers/textTools";

export abstract class PohEvent {
  key: string;
  title: string;

  // Override this to provide a custom title for the event
  getTitle = (forPlayer: Player) => {
    const titlePieces = [];

    if (this.player) {
      titlePieces.push(this.player.key === forPlayer.key ? "You have" : `${this.player.name} has`);
    }

    titlePieces.push(this.title);

    if (this.city) {
      titlePieces.push(`in ${this.city.name}`);
    }

    if (this.reason) {
      titlePieces.push(`due to ${this.reason}`);
    }

    return capitalize(titlePieces.join(" "));
  };
  isRead = false;

  // A specific reason why this happened?
  reason?: string;

  // Relates to a specific type object?
  typeObj?: TypeObject;

  // Relates to a specific game object?
  subject?: GameObject;

  // Relates to a specific player/tile/city?
  // NOTE: if none are set, no-one will see the Event
  // When they are, only players who know about all these will see it
  player?: Player | null;
  tile?: Tile | null;
  city?: City | null;

  protected constructor(title: string) {
    this.key = crypto.randomUUID();
    this.title = title;
  }
}
