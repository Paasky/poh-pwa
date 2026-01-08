import { Note, Priority, Region } from "@/Actor/Ai/AiTypes";
import { IBrain } from "@/Actor/Ai/Common/IBrain";
import { LocalBrain } from "@/Actor/Ai/Local/LocalBrain";
import { Player } from "@/Common/Models/Player";

export class RegionBrain implements IBrain {
  public readonly notes: Note[] = [];
  public readonly localBrains: Map<string, LocalBrain> = new Map();

  constructor(public readonly player:Player, public readonly region: Region) {
    region.localities.forEach(locality => {
      this.localBrains.set(locality.id, new LocalBrain(player, locality))
    })
  }
  analyze(): Note[] {
    this.localBrains.forEach((localBrain) => {
      this.notes.push(...localBrain.analyze());
    });

    // Run local analysis

    return this.notes;
  }
  act(priorities: Priority[]): Note[] {
    throw new Error("Method not implemented.");
  }
}