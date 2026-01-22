import { DataBucket } from "@/Data/DataBucket";
import type { GameKey, GameObject, IRawGameObject } from "@/Common/Models/_GameModel";
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
import { PohMutation } from "@/Common/PohMutation";
import { diff } from "@/Common/Helpers/collectionTools";
import { TypeStorage } from "@/Common/Objects/TypeStorage";

export class DataStore {
  readonly dataBucket: DataBucket;

  constructor(dataBucket?: DataBucket) {
    this.dataBucket = dataBucket ?? useDataBucket();
  }

  set(mutations: PohMutation<GameObject>[]): void {
    const set = [] as IRawGameObject[];
    const remove = [] as GameKey[];

    mutations.forEach((mutation) => {
      // Verify obj exists (+ needed for adv types)
      const obj = this.dataBucket.getObject(mutation.payload.key);

      switch (mutation.type) {
        // Simple types
        case "create":
        case "update":
          set.push(mutation.payload);
          break;

        // Types that modify a property of an existing object
        case "append":
        case "filter":
        case "setKeys":
          {
            // Build payload as combo of object value + payload; IDE complains without any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload = {} as any;

            for (const [key, value] of Object.entries(mutation.payload)) {
              if (key === "key") continue;

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const objValue = obj[key as keyof typeof obj] as any;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const payloadValue = value as any;

              if (mutation.type === "append") {
                payload[key] = [...(objValue ?? []), ...(payloadValue ?? [])];
              }

              if (mutation.type === "filter") {
                payload[key] = diff(objValue ?? [], payloadValue ?? []);
              }

              if (mutation.type === "setKeys") {
                if (objValue instanceof TypeStorage) {
                  payload[key] = { ...objValue.toJson(), ...(payloadValue ?? {}) };
                } else {
                  payload[key] = { ...(objValue ?? {}), ...(payloadValue ?? {}) };
                }
              }
            }
            set.push(payload);
          }
          break;

        // Types that remove an object from the bucket
        case "remove":
          remove.push(mutation.payload.key);
          break;
        default:
          throw new Error(`Unknown mutation.type '${mutation.type}' in DataStore.set()`);
      }
    });

    const backup = this.dataBucket.toSaveData("backup", "backup");

    try {
      remove.forEach(this.dataBucket.removeObject);
      this.dataBucket.setRawObjects(set);
    } catch (error) {
      this.dataBucket.restore(backup);
      throw error;
    }
  }

  private eventFromMutation(
    mutation: PohMutation<GameObject>,
    object: GameObject,
    players: Set<Player>,
  ): IEvent {
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
