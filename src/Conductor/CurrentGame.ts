// noinspection JSIgnoredPromiseFromCall

import { DataBucket, RawSaveData } from "@/Data/DataBucket";
import { GameKey } from "@/Common/Models/_GameTypes";
import { Brain } from "@/Actor/Ai/Brain";
import { asyncProcess, ProgressCallback, Task } from "@/helpers/asyncProcess";
import { hasDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { Tile } from "@/Common/Models/Tile";
import { Player } from "@/Common/Models/Player";
import { City } from "@/Common/Models/City";
import { Unit } from "@/Common/Models/Unit";
import { MapGenConfig } from "@/stores/mapGenStore";
import { createWorld } from "@/factories/worldFactory";

export class CurrentGame {
  bucket!: DataBucket;
  readonly id: string;
  currentPlayer?: Player;
  aiBrains?: Map<GameKey, Brain>;

  constructor(
    initGame: Task, // title = Loading Game / Creating World
    props?: { extraTasks?: Task[]; id?: string; progressCallback?: ProgressCallback },
  ) {
    this.id = props?.id ?? crypto.randomUUID();

    const tasks = [
      {
        title: "Loading Static Data",
        fn: async () => {
          if (!hasDataBucket()) {
            this.bucket = await DataBucket.init();
          }
        },
      },
      initGame,
      {
        title: "Loading Tiles",
        fn: () => this.bucket.getClassObjects<Tile>("tile").forEach((t) => t.warmUp()),
      },
      {
        title: "Loading Players",
        fn: () => this.bucket.getClassObjects<Player>("player").forEach((p) => p.warmUp()),
      },
      {
        title: "Loading Cities",
        fn: () => this.bucket.getClassObjects<City>("city").forEach((c) => c.warmUp()),
      },
      {
        title: "Loading Units",
        fn: () => this.bucket.getClassObjects<Unit>("unit").forEach((u) => u.warmUp()),
      },
      ...(props?.extraTasks ?? []),
    ];

    asyncProcess(tasks, (task) => task.fn(), props?.progressCallback);
  }

  loadActors(currentPlayer: Player, aiBrains: Map<GameKey, Brain>): void {
    this.currentPlayer = currentPlayer;
    this.aiBrains = aiBrains;
  }

  static newGameTask = (mapGenConfig: MapGenConfig): Task => {
    return {
      title: "Creating World",
      fn: () => {
        const dataBucket = useDataBucket();
        // Set a partial World (used by World Factory)
        dataBucket.setWorld(mapGenConfig.worldState);

        const worldBundle = createWorld(mapGenConfig);

        // Set the full World State and Objects from the generated bundle
        dataBucket.setWorld(worldBundle.world);
        dataBucket.setRawObjects(worldBundle.objects);
      },
    };
  };

  static loadGameTask = (rawSaveData: RawSaveData): Task => {
    return {
      title: "Loading Game",
      fn: () => {
        const dataBucket = useDataBucket();
        dataBucket.setWorld(rawSaveData.world);
        dataBucket.setRawObjects(rawSaveData.objects);
      },
    };
  };
}
