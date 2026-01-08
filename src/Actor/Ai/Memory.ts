import { Region } from "@/Actor/Ai/AiTypes";
import { RegionBrain } from "@/Actor/Ai/Regional/RegionBrain";

export class Memory {
  public readonly regionBrains: Map<string, RegionBrain>;

  constructor (public readonly regions: Set<Region>) {
    this.regionBrains = new Map();
    regions.forEach((region: Region) => {
      this.regionBrains.set(region.id, new RegionBrain(region));
    })
  }
}