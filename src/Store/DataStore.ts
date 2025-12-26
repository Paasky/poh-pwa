import { IMutation } from "@/Common/IMutation";
import { DataBucket } from "@/Store/DataBucket";
import type { CategoryObject, TypeObject } from "@/types/typeObjects";
import { GameKey, GameObject, IRawGameObject } from "@/objects/game/_GameObject";
import { IEvent } from "@/Common/IEvent";
import { publishEvents } from "@/Common/EventBus";

export class DataStore {
  constructor(private readonly dataBucket: DataBucket) {}

  set(mutations: IMutation[]): void {
    const set = [] as IRawGameObject[];
    const remove = [] as GameKey[];
    const events = [] as IEvent[];

    mutations.forEach((mutation) => {
      switch (mutation.type) {
        case "create":
        case "update":
          set.push(mutation.payload);
          break;
        case "remove":
          remove.push(mutation.payload.key);
          break;
      }
      events.push(this.eventFromMutation(mutation));
    });

    const backup = this.dataBucket.toSaveData();

    try {
      remove.forEach(this.dataBucket.removeObject);
      this.dataBucket.setRawObjects(set);
    } catch (error) {
      this.dataBucket.restore(backup);
      throw error;
    }
  }

  getData(): { types: TypeObject[]; categories: CategoryObject[]; objects: GameObject[] } {
    return {
      types: this.dataBucket.getTypes(),
      categories: this.dataBucket.getCats(),
      objects: this.dataBucket.getObjects(),
    };
  }

  private emit(events: IEvent[]): void {
    const toPlayers = new Set<GameKey>();
    for (const event of events) {
      event.playerKeys.forEach((key) => toPlayers.add(key));
    }
    publishEvents(toPlayers, events);
  }

  private eventFromMutation(mutation: IMutation): IEvent {
    // todo
  }
}
