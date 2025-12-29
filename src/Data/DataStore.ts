// noinspection JSUnusedGlobalSymbols

import type { IMutation } from "@/Common/IMutation";
import { DataBucket } from "@/Data/DataBucket";
import type { CategoryObject, TypeObject } from "@/Common/Objects/TypeObject";
import type { GameKey, GameObject, IRawGameObject } from "@/Common/Models/_GameModel";
import type { IEvent } from "@/Common/IEvent";
import { publishEvents } from "@/Common/EventBus";
import type { Agenda } from "@/Common/Models/Agenda";
import type { Citizen } from "@/Common/Models/Citizen";
import type { City } from "@/Common/Models/City";
import type { Construction } from "@/Common/Models/Construction";
import type { Culture } from "@/Common/Models/Culture";
import type { Deal } from "@/Common/Models/Deal";
import type { Player } from "@/Common/Models/Player";
import type { Religion } from "@/Common/Models/Religion";
import type { River } from "@/Common/Models/River";
import type { TradeRoute } from "@/Common/Models/TradeRoute";
import type { Unit } from "@/Common/Models/Unit";
import type { UnitDesign } from "@/Common/Models/UnitDesign";
import { useDataBucket } from "@/Data/useDataBucket";

export class DataStore {
  readonly dataBucket: DataBucket;

  constructor() {
    this.dataBucket = useDataBucket();
  }

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
    });

    const backup = this.dataBucket.toSaveData();

    try {
      remove.forEach(this.dataBucket.removeObject);
      this.dataBucket.setRawObjects(set);
    } catch (error) {
      this.dataBucket.restore(backup);
      throw error;
    }

    try {
      const players = this.dataBucket.getClassObjects<Player>("player");
      mutations.forEach((mutation) => {
        events.push(
          this.eventFromMutation(
            mutation,
            this.dataBucket.getObject(mutation.payload.key),
            players,
          ),
        );
      });

      publishEvents(events);
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

  private eventFromMutation(mutation: IMutation, object: GameObject, players: Set<Player>): IEvent {
    const eventPlayerKeys = new Set<GameKey>();

    switch (object.class) {
      case "agenda":
      case "culture":
        players.forEach((player) => {
          if (player.knownTileKeys.has((object as Agenda | Culture).playerKey)) {
            eventPlayerKeys.add(player.key);
          }
        });
        break;

      case "unitDesign":
        players.forEach((player) => {
          if (
            !(object as UnitDesign).playerKey ||
            player.knownTileKeys.has((object as UnitDesign).playerKey!)
          ) {
            eventPlayerKeys.add(player.key);
          }
        });
        break;

      case "citizen":
      case "city":
      case "construction":
        players.forEach((player) => {
          if (player.knownTileKeys.has((object as Citizen | City | Construction).tileKey)) {
            eventPlayerKeys.add(player.key);
          }
        });
        break;

      case "deal":
        players.forEach((player) => {
          if (
            player.key === (object as Deal).fromPlayerKey ||
            player.key === (object as Deal).toPlayerKey ||
            player.knownPlayerKeys.has((object as Deal).fromPlayerKey) ||
            player.knownPlayerKeys.has((object as Deal).toPlayerKey)
          ) {
            eventPlayerKeys.add(player.key);
          }
        });
        break;

      case "player":
        players.forEach((player) => {
          if (
            player.key === (object as Player).key ||
            player.knownPlayerKeys.has((object as Player).key)
          ) {
            eventPlayerKeys.add(player.key);
          }
        });
        break;

      case "religion":
        players.forEach((player) => {
          if (player.knownReligionKeys.has((object as Religion).key)) {
            eventPlayerKeys.add(player.key);
          }
        });
        break;

      case "river":
      case "tradeRoute":
        players.forEach((player) => {
          (object as River | TradeRoute).tileKeys.forEach((tileKey) => {
            if (player.knownTileKeys.has(tileKey)) {
              eventPlayerKeys.add(player.key);
            }
          });
        });
        break;

      case "tile":
        players.forEach((player) => {
          if (player.knownTileKeys.has(object.key)) {
            eventPlayerKeys.add(player.key);
          }
        });
        break;

      case "unit":
        players.forEach((player) => {
          if (player.visibleTileKeys.has((object as Unit).tileKey)) {
            eventPlayerKeys.add(player.key);
          }
        });
        break;

      default:
        throw new Error(`Missing case '${object.class}' in DataStore.eventFromMutation()`);
    }

    const event = {
      playerKeys: eventPlayerKeys,
      mutation,
    } as IEvent;

    if (mutation.type === "create") {
      event.object = object;
    }

    return event;
  }
}
