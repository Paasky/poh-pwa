import { City } from "@/Common/Models/City";
import { Construction } from "@/Common/Models/Construction";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { DataStore } from "@/Data/DataStore";
import { createUnit } from "@/Simulation/MutationFactory";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { IMutation } from "@/Common/IMutation";

export class CityStartTurn implements ISimAction {
  private readonly dataStore: DataStore;
  constructor(public readonly city: City) {
    this.dataStore = new DataStore();
  }

  completeConstruction(construction: Construction): void {
    // todo
  }
  createCitizen(): void {
    // todo
  }
  loseWorldWonder(construction: Construction): void {
    // todo
  }
  createUnit(unitDesign: UnitDesign): void {
    this.dataStore.set([
      createUnit({
        playerKey: this.city.player.key,
        designKey: unitDesign.key,
        tileKey: this.city.tile.key,
      }),
    ]);
  }

  startTurn(): CityCompleted {
    // todo
    return {};
  }
}

export type CityCompleted = {
  mutations: IMutation<City>[];
  citizen?: true;
  construction?: Construction;
  training?: UnitDesign;
};
