import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initTestDataBucket } from "../_setup/dataHelpers";
import { destroyDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { subscribeToEvents } from "@/Common/Buses/EventBus";
import { PohEvent } from "@/Common/PohEvent";
import { GameKey } from "@/Common/Models/_GameTypes";
import { pushActions, subscribeToActions } from "@/Common/Buses/ActionBus";
import { PohAction } from "@/Common/PohAction";
import { tileKey } from "@/Common/Helpers/mapTools";
import { DataStore } from "@/Data/DataStore";
import { PohMutation } from "@/Common/PohMutation";
import { Player } from "@/Common/Models/Player";
import { Unit } from "@/Common/Models/Unit";

describe("Buses Test", () => {
  beforeEach(async () => {
    await initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("Event -> Mutation -> Action", () => {
    const actionLog = new Map<GameKey, PohAction[]>();
    const eventLog: PohEvent[] = [];
    const store = new DataStore();

    // Simple test data: Player moves Unit
    const player = {
      key: "player:1" as GameKey,
    } as Player;
    const unit = {
      key: "unit:1" as GameKey,
      tileKey: tileKey(0, 0),
    } as Unit;

    useDataBucket().setObject(player);
    useDataBucket().setObject(unit);

    // Player pushes an action -> picked up -> converted to mutation -> set to store -> pushed as event
    const actions: PohAction[] = [
      {
        type: "actionType:move",
        turn: 1,
        timestamp: 123456789,
        tileKey: tileKey(0, 1),
        unitKey: unit.key,
      },
    ];
    const mutations: PohMutation<Player | Unit>[] = [
      {
        type: "update",
        payload: {
          key: actions[0].unitKey!,
          tileKey: actions[0].tileKey!,
        },
      },
    ];
    const events: PohEvent[] = [
      {
        playerKeys: new Set([player.key]),
        mutations,
        object: { key: unit.key },
      },
    ];

    // On Action push -> run expect & set Mutation into Store
    subscribeToActions((playerKey, actions) => {
      const existingActions = actionLog.get(playerKey) ?? [];
      actionLog.set(playerKey, [...existingActions, ...actions]);

      // Assert Actions are what they should be
      expect(actions).toEqual([
        {
          type: "actionType:move",
          turn: 1,
          timestamp: 123456789,
          tileKey: tileKey(0, 1),
          unitKey: unit.key,
        },
      ]);

      // Actions are correct -> set Mutations into Store
      store.set(mutations);
    });

    // On Events push -> add to event log
    subscribeToEvents(player.key, (events) => {
      eventLog.push(...events);
    });

    // Trigger the flow by pushing the Actions (eg "Move Unit 1 from 0,0 to 0,1")
    pushActions(player.key, actions);

    // Actions were pushed & logged
    expect(actionLog.get(player.key)).toEqual(actions);

    // Unit data has Mutated
    expect(unit.tileKey).toEqual(tileKey(0, 1));

    // Events were pushed & logged
    expect(eventLog).toEqual(events);
  });
});
