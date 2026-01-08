import { Player } from "@/Common/Models/Player";
import { Difficulty, Note } from "@/Actor/Ai/AiTypes";
import { Memory } from "@/Actor/Ai/Memory";
import { IBrain } from "@/Actor/Ai/Common/IBrain";
import { StrategicBrain } from "@/Actor/Ai/Strategic/StrategicBrain";

export class Brain implements IBrain {
  public readonly strategicBrain: StrategicBrain;
  public readonly notes: Note[] = [];

  constructor(
    public readonly player: Player,
    public readonly memory: Memory,
    public readonly difficulty: Difficulty,
  ) {
    this.strategicBrain=new StrategicBrain(player);
  }

  analyze(): void {
    // Analyze each Region
    this.memory.regionBrains.forEach((regionBrain) => {
      this.notes.push(...regionBrain.analyze());
    });

    // Analyze Strategy

    // Analyze each Region

    // Analyze each Locality

    // Act Strategy

    // Act each Region

    // Act each Locality
  }
}