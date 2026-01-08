import { Unit } from "@/Common/Models/Unit";
import { Construction } from "@/Common/Models/Construction";
import { DataStore } from "@/Data/DataStore";
import { IMutation, mergeMutations } from "@/Common/IMutation";
import { Health } from "@/Simulation/Common/Health";
import { Construct } from "@/Simulation/Common/Construct";

export class UnitAutomation {
  private readonly dataStore: DataStore;
  constructor(public readonly unit: Unit) {
    this.dataStore = new DataStore();
  }

  completeImprovement(construction: Construction): void {
    this.dataStore.set([new Construct(this.unit).complete(construction)]);
  }
  completeTerraform(): void {
    const mutation = {
      type: "update",
      payload: {
        key: this.unit.tile.key,
      },
    } as IMutation;

    switch (this.unit.action?.type) {
      case "actionType:clear":
        mutation.payload.featureKey = null;
        break;
      case "actionType:clean":
        mutation.payload.pollutionKey = null;
        break;
      default:
        throw new Error(`Invalid terraform action: ${this.unit.action?.type}`);
    }

    this.dataStore.set([mutation]);
  }

  startTurn(): UnitCompleted {
    const mutations: IMutation[] = [];

    // 1. Reset movement and attack status
    mutations.push({
      type: "update",
      payload: {
        key: this.unit.key,
        moves: this.unit.movement.moves,
        canAttack: this.unit.canAttack,
      },
    });

    // 2. Handle healing/damage
    const health = new Health(this.unit);
    const healthChange = health.getChangeNextTurn();
    const healthMutation = health.modify(healthChange);
    if (healthMutation) mutations.push(healthMutation);

    // 3. Check for completed actions

    this.dataStore.set(mergeMutations(mutations));
    return {};
  }
}

export type UnitCompleted = {
  improvement?: Construction;
  terraform?: true;
};
