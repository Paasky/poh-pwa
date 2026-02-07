import { City } from "@/Common/Models/City";
import { Construction } from "@/Common/Models/Construction";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { DataStore } from "@/Data/DataStore";
import { createUnit } from "@/Simulation/MutationFactory";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { PohMutation } from "@/Common/PohMutation";

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
    if (construction.key !== construction.city?.constructions.values().next().value?.key) {
      construction.cancel(this.city.player, true);
    }
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
  mutations: PohMutation<City>[];
  citizen?: true;
  construction?: Construction;
  training?: UnitDesign;
};
