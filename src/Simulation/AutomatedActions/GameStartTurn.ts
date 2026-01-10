import { TypeKey } from "@/Common/Objects/Common";
import { useDataBucket } from "@/Data/useDataBucket";
import { Player } from "@/Common/Models/Player";
import { PlayerAutomation } from "@/Simulation/AutomatedActions/PlayerAutomation";
import { map, takeRandomItem } from "@/Common/Helpers/collectionTools";
import { CityStartTurn } from "@/Simulation/AutomatedActions/CityStartTurn";
import { asyncProcess } from "@/Common/Helpers/asyncProcess";
import { Construction } from "@/Common/Models/Construction";

// Most top-level Manager that deals with the game's turn-cycle
export class GameStartTurn {
  private readonly bucket: ReturnType<typeof useDataBucket>;

  constructor(private readonly onProgress?: ProgressCallback) {
    this.bucket = useDataBucket();
  }

  async startTurn(): Promise<void> {
    const players = this.bucket.getClassObjects<Player>("player");
    const completedWorldWonders = new Map<TypeKey, Construction[]>();

    const tasks: TurnTask[] = [
      ...map(players, (player) => ({
        title: `Processing ${player.name}...`,
        fn: async () => {
          const playerComplete = new PlayerAutomation(player).startTurn();

          playerComplete.worldWonders?.forEach((construction) => {
            const constructions = completedWorldWonders.get(construction.type.key);
            if (constructions) {
              constructions.push(construction);
            } else {
              completedWorldWonders.set(construction.type.key, [construction]);
            }
          });
        },
      })),
      {
        title: "Resolving World Wonders...",
        fn: () => {
          completedWorldWonders.forEach(this.processCompletedWorldWonder);
        },
      },
    ];

    // Run the high-level sequence
    let taskTitle = "";
    await asyncProcess(
      tasks,
      async (task) => {
        taskTitle = task.title;
        await task.fn();
      },
      (percent) => {
        this.onProgress?.(taskTitle, percent);
      },
    );

    this.onProgress?.("Ready", true);
  }

  private processCompletedWorldWonder(constructions: Construction[]): void {
    const winner = takeRandomItem(constructions)!;
    new CityStartTurn(winner.city!).completeConstruction(winner);

    constructions.forEach((construction) => {
      new CityStartTurn(construction.city!).loseWorldWonder(construction);
    });
  }
}

export type ProgressCallback = (status: string, percent: number | true) => void;

interface TurnTask {
  title: string;
  fn: () => void | Promise<void>;
}
