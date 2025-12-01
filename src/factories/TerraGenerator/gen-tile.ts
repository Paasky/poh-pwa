import { Tile } from "@/objects/game/Tile";

export class GenTile extends Tile {
  isContinentCenter = false;
  isStart: "major" | "minor" | null = null;

  canBeLand() {
    return !this.isSalt;
  }

  canBeStart() {
    return !this.isStart && this.domain.key === "domainType:land";
  }

  canBeWater() {
    return !this.isStart && !this.isContinentCenter;
  }

  canChangeDomain() {
    return this.domain.key === "domainType:land" ? this.canBeWater() : this.canBeLand();
  }
}
