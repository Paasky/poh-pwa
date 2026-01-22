import { Government, GovernmentConfig } from "@/Common/Models/Government";
import { PohMutation } from "@/Common/PohMutation";
import { roundToTenth } from "@/Common/Objects/World";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";

export class GovernmentStartTurn implements ISimAction {
  constructor(private readonly government: Government) {}

  validateAction(): this {
    return this;
  }

  handleAction(): PohMutation<Government>[] {
    const mutation: PohMutation<Government> = {
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
