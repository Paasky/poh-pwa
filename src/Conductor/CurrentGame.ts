// noinspection JSIgnoredPromiseFromCall

import { DataBucket, RawSaveData } from "@/Data/DataBucket";
import { GameKey } from "@/Common/Models/_GameTypes";
import { Brain } from "@/Actor/Ai/Brain";
import { asyncProcess, ProgressCallback, Task } from "@/Common/Helpers/asyncProcess";
import { hasDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { Tile } from "@/Common/Models/Tile";
import { Player } from "@/Common/Models/Player";
import { City } from "@/Common/Models/City";
import { Unit } from "@/Common/Models/Unit";
import { MapGenConfig } from "@/App/stores/mapGenStore";
import { createWorld } from "@/Common/factories/worldFactory";
import { Difficulty } from "@/Actor/Ai/AiTypes";
import { Memory } from "@/Actor/Ai/Memory";
import { rng } from "@/Common/Helpers/Rng";

export class CurrentGame {
  bucket!: DataBucket;
  readonly id: string;
  readonly ready: Promise<void>;
  currentPlayer?: Player;
  readonly aiBrains: Map<GameKey, Brain> = new Map();

  constructor(
    initGame: Task, // title = Loading Game / Creating World
    props?: {
      extraTasks?: Task[];
      id?: string;
      progressCallback?: ProgressCallback;
      difficulty?: Difficulty;
    },
  ) {
    this.id = props?.id ?? crypto.randomUUID();

    const tasks = [
      {
        title: "Loading Static Data",
        fn: async () => {
          if (!hasDataBucket()) {
            this.bucket = await DataBucket.init();
          } else {
            this.bucket = useDataBucket();
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
      {
        title: "Initializing Actors",
        fn: () => {
          const players = this.bucket.getClassObjects<Player>("player");
          const world = this.bucket.world;
          const difficulty = props?.difficulty ?? "regular";

          for (const player of players) {
            if (player.key === world.currentPlayerKey) {
              this.currentPlayer = player;
            }

            if (!player.isHuman) {
              this.aiBrains.set(player.key, new Brain(player, difficulty, new Memory(), new Set()));
            }
          }
        },
      },
      ...(props?.extraTasks ?? []),
    ];

    this.ready = asyncProcess(tasks, (task) => task.fn(), props?.progressCallback);
  }

  static newGameTask = (mapGenConfig: MapGenConfig): Task => {
    return {
      title: "Creating World",
      fn: () => {
        rng.seed(mapGenConfig.seed);
        const dataBucket = useDataBucket();
        // Set a partial World (used by World Factory)
        dataBucket.setWorld({ ...mapGenConfig.worldState, seed: mapGenConfig.seed });

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
        if (rawSaveData.rngState) {
          rng.setState(rawSaveData.rngState);
        } else if (rawSaveData.world.seed) {
          rng.seed(rawSaveData.world.seed);
        }

        const dataBucket = useDataBucket();
        dataBucket.setWorld(rawSaveData.world);
        dataBucket.setRawObjects(rawSaveData.objects);
      },
    };
  };
}
