import { Government, GovernmentConfig } from "@/Common/Models/Government";
import { IMutation } from "@/Common/IMutation";
import { roundToTenth } from "@/Common/Objects/Common";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";

export class GovernmentStartTurn implements ISimAction {
  constructor(private readonly government: Government) {}

  validateAction(): this {
    return this;
  }

  handleAction(): IMutation<Government>[] {
    const mutation: IMutation<Government> = {
      type: "update",
      payload: {
        key: this.government.key,
      },
    };

    // Run next election countdown
    if (this.government.hasElections) {
      mutation.payload.nextElection = Math.max(0, this.government.nextElection - 1);
    }

    // Corruption (negative Order)
    mutation.payload.corruption = Math.max(
      0,
      roundToTenth(
        this.government.corruption +
          GovernmentConfig.corruption.getAmount(
            this.government.hasElections,
            this.government.corruption,
          ),
      ),
    );

    // Discontent (negative Happiness)
    mutation.payload.discontent = Math.max(
      0,
      roundToTenth(
        GovernmentConfig.discontent.getAmount(
          this.government.hasElections,
          (mutation.payload.nextElection ?? 0) <= 0,
        ),
      ),
    );

    return [mutation];
  }
}