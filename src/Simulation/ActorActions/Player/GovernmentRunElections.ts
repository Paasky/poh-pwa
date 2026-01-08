import { Government, GovernmentConfig } from "@/Common/Models/Government";
import { IMutation } from "@/Common/IMutation";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { CatKey, roundToTenth, TypeKey } from "@/Common/Objects/Common";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { filter } from "@/helpers/collectionTools";

export class GovernmentRunElections implements ISimAction{
  constructor(private readonly government: Government) {}

  validateAction (): this {
    if (!this.government.hasElections){
      throw new Error(`Player ${this.government.player.name} cannot run elections`);
    }
    if (this.government.nextElection > 0){
      throw new Error(`Player ${this.government.player.name} cannot run elections yet`);
    }
    return this;
  }

  handleAction (): IMutation<Government>[] {
    const mutation: IMutation<Government> = {
      type:"update",
      payload: {key:this.government.key}
    };

    // Find the top policy per category (top = most citizens with policy)
    const countedPolicies = {} as Record<
      CatKey,
      Record<TypeKey, { policy: TypeObject; citizens: number }>
    >;

    this.government.selectablePolicies.forEach((policy) => {
      const category = policy.category!;
      if (!countedPolicies[category]) countedPolicies[category] = {};

      countedPolicies[category][policy.key] = {
        policy: policy as TypeObject,
        citizens: filter(this.government.player.citizens, (citizen) => citizen.policy === policy).size,
      };
    });

    mutation.payload.policies = new Set<TypeObject>()
    Object.values(countedPolicies).forEach((policies) => {
      const sorted = Object.values(policies).sort((a, b) => b.citizens - a.citizens);
      mutation.payload.policies!.add(sorted[0].policy);
    });

    // Remove up to 100% discontent
    mutation.payload.discontent = Math.max(0, roundToTenth(this.government.discontent - GovernmentConfig.electionRemoveDiscontent));

    // Set next elections in 25 turns
    mutation.payload.nextElection = GovernmentConfig.electionsEveryNthTurn;

    return [mutation];
  }
}