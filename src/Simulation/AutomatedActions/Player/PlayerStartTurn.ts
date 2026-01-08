import { Player } from "@/Common/Models/Player";
import { map } from "@/helpers/collectionTools";
import { Construction } from "@/Common/Models/Construction";
import { ResearchStartTurn } from "@/Simulation/AutomatedActions/Player/ResearchStartTurn";
import { GovernmentStartTurn } from "@/Simulation/AutomatedActions/Player/GovernmentStartTurn";
import { DiplomacyStartTurn } from "@/Simulation/AutomatedActions/Player/DiplomacyStartTurn";
import { IMutation } from "@/Common/IMutation";
import { Diplomacy } from "@/Common/Objects/Diplomacy";
import { Government } from "@/Common/Models/Government";
import { Research } from "@/Common/Models/Research";
import { YieldTypeKey } from "@/Common/Objects/Yields";
import { CityStartTurn } from "@/Simulation/AutomatedActions/City/CityStartTurn";

export class PlayerStartTurn {
  constructor(private readonly player: Player) {}

  // Return completed World Wonders
  startTurn(): PlayerCompleted {
    // 1) Add Yields of prev turn into Storage
    for (const [typeKey, amount] of Object.entries(this.player.yields.toStorage(false).all())) {
      this.player.storage.add(typeKey as YieldTypeKey, amount);
    }

    // 2) Start City & Unit turns before anything else can affect their outcome
    // Remember completed/new City items so they don't affect other outcomes
    const cityStarts = map(this.player.cities, (city) => new CityStartTurn(city));
    const unitStarts = map(this.player.units, (unit) => new UnitAutomation(unit));

    const cityCompleted = [] as {
      manager: CityStartTurn;
      completed: CityCompleted;
    }[];
    const unitCompleted = [] as {
      manager: UnitAutomation;
      completed: UnitCompleted;
    }[];

    cityStarts.forEach((cityManager) => {
      cityCompleted.push({ manager: cityManager, completed: cityManager.startTurn() });
    });
    unitStarts.forEach((unitManager) => {
      unitCompleted.push({ manager: unitManager, completed: unitManager.startTurn() });
    });

    // 3) Start Diplomacy, Government & Research turns
    const mutations = [
      ...new DiplomacyStartTurn(this.player.diplomacy).validateAction().handleAction(),
      ...new GovernmentStartTurn(this.player.government).validateAction().handleAction(),
      ...new ResearchStartTurn(this.player.research).validateAction().handleAction(),
    ];

    // 4) Process Completed City items
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

    return { mutations, worldWonders: completedWorldWonders };
  }
}

export type PlayerCompleted = {
  mutations: IMutation<Diplomacy|Government|Player|Research>[];
  worldWonders?: Construction[];
};
