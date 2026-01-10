import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initTestDataBucket, playerRawData } from "../../../_setup/dataHelpers";
import { destroyDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { Agenda } from "@/Common/Models/Agenda";
import { Player } from "@/Common/Models/Player";
import { generateKey } from "@/Common/Models/_GameModel";
import { testManyToOneRelation } from "../../../_setup/testHelpers";

describe("Agenda", () => {
  beforeEach(async () => {
    await initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("hasOne Actor: relation works both ways", () => {
    const agendaKey1 = generateKey("agenda");
    const agendaKey2 = generateKey("agenda");
    const playerKey1 = "player:1";
    const playerKey2 = "player:2";

    useDataBucket().setRawObjects([
      ...playerRawData(playerKey1),
      ...playerRawData(playerKey2),
      { key: agendaKey1, playerKey: playerKey1 } as any,
      { key: agendaKey2, playerKey: playerKey2 } as any,
    ]);

    const agenda1 = useDataBucket().getObject<Agenda>(agendaKey1);
    const player1 = useDataBucket().getObject<Player>(playerKey1);
    const agenda2 = useDataBucket().getObject<Agenda>(agendaKey2);
    const player2 = useDataBucket().getObject<Player>(playerKey2);

    testManyToOneRelation(agenda1, "player", player1, "agendas");
    testManyToOneRelation(agenda2, "player", player2, "agendas");
  });

  it("hasOne Actor: throws correct message if key is invalid (direct set & from raw)", () => {
    // Set raw is protected against invalid data
    const agendaKey = generateKey("agenda");
    const rawData = { key: agendaKey, playerKey: "player:99" } as any;
    expect(() => useDataBucket().setRawObjects([rawData])).toThrow(
      `Related object 'player:99' does not exist. Raw data: ${JSON.stringify(rawData)}`,
    );

    // Set object bypasses checks so the relation throws
    const agenda = new Agenda(agendaKey, "player:99");
    useDataBucket().setObject(agenda);
    expect(() => agenda.player).toThrow(`DataBucket.getObject(player:99) does not exist!`);
  });

  it("hasOne Actor: throws correct message if key not given (direct & raw)", () => {
    const agendaKey = generateKey("agenda");

    // Raw
    expect(() => useDataBucket().setRawObjects([{ key: agendaKey } as any])).toThrow(
      `Required attribute 'playerKey' missing from {"key":"${agendaKey}"}`,
    );

    // Direct
    const agenda = new Agenda(agendaKey, null as any);
    expect(() => agenda.player).toThrow(`Empty relation key 'playerKey' (in ${agendaKey})`);
  });
});
