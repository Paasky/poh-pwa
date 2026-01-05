import { Player } from "@/Common/Models/Player";
import { CityAutomation, CityCompleted } from "@/Simulation/Automation/CityAutomation";
import { map } from "@/helpers/collectionTools";
import { UnitAutomation, UnitCompleted } from "@/Simulation/Automation/UnitAutomation";
import { Construction } from "@/Common/Models/Construction";

export class PlayerAutomation {
  constructor(private readonly player: Player) {}

  // Return completed World Wonders
  startTurn(): PlayerCompleted {
    // 1) Load Yields of prev turn into Storage
    this.player.storage.load(this.player.yields.toStorage().all());

    // 2) Start City & Unit turns before anything else can affect their outcome
    // Remember completed/new City items so they don't affect other outcomes
    const cityManagers = map(this.player.cities, (city) => new CityAutomation(city));
    const unitManagers = map(this.player.units, (unit) => new UnitAutomation(unit));

    const cityCompleted = [] as {
      manager: CityAutomation;
      completed: CityCompleted;
    }[];
    const unitCompleted = [] as {
      manager: UnitAutomation;
      completed: UnitCompleted;
    }[];

    cityManagers.forEach((cityManager) => {
      cityCompleted.push({ manager: cityManager, completed: cityManager.startTurn() });
    });
    unitManagers.forEach((unitManager) => {
      unitCompleted.push({ manager: unitManager, completed: unitManager.startTurn() });
    });

    // 3) Start Culture, Diplomacy, Government & Research turns
    this.player.culture.startTurn();
    this.player.diplomacy.startTurn();
    this.player.government.startTurn();
    this.player.research.startTurn();

    // 4) If player has Religion & owns the Holy City, start Religion turn
    if (this.player.religion?.city.playerKey === this.player.key) this.player.religion.startTurn();

    // 5) Process Completed City items
    // World Wonders will be resolved by GameAutomation (deduplication)
    const completedWorldWonders = [] as Construction[];
    cityCompleted.forEach(({ manager, completed }) => {
      if (completed.citizen) manager.createCitizen();

      if (completed.construction) {
        if (completed.construction.type.class === "worldWonderType") {
          completedWorldWonders.push(completed.construction);
        } else {
          // Can be by City (Building/Wonder) or Unit (Improvement)
          manager.completeConstruction(completed.construction);
        }
      }

      if (completed.training) manager.createUnit(completed.training);
    });

    // 6) Process Completed Unit items
    unitCompleted.forEach(({ manager, completed }) => {
      if (completed.improvement) manager.completeImprovement(completed.improvement);
      if (completed.terraform) manager.completeTerraform();
    });

    return { worldWonders: completedWorldWonders };
  }
}

export type PlayerCompleted = {
  worldWonders?: Construction[];
};
