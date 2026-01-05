import { TypeKey } from "@/Common/Objects/Common";
import { useDataBucket } from "@/Data/useDataBucket";
import { Player } from "@/Common/Models/Player";
import { PlayerAutomation } from "@/Simulation/Automation/PlayerAutomation";
import { map, takeRandomItem } from "@/helpers/collectionTools";
import { CityAutomation } from "@/Simulation/Automation/CityAutomation";
import { asyncProcess } from "@/helpers/asyncProcess";
import { Construction } from "@/Common/Models/Construction";

// Most top-level Manager that deals with the game's turn-cycle
export class GameAutomation {
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
    new CityAutomation(winner.city!).completeConstruction(winner);

    constructions.forEach((construction) => {
      new CityAutomation(construction.city!).loseWorldWonder(construction);
    });
  }
}

export type ProgressCallback = (status: string, percent: number | true) => void;

interface TurnTask {
  title: string;
  fn: () => void | Promise<void>;
}
