import { Research } from "@/Common/Models/Research";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { PohMutation } from "@/Common/PohMutation";
import { ResearchProgress } from "@/Simulation/AutomatedActions/Player/ResearchProgress";
import { Player } from "@/Common/Models/Player";

export class ResearchStartTurn implements ISimAction {
  constructor(private readonly research: Research) {}

  validateAction(): this {
    return this;
  }

  handleAction(): PohMutation<Research | Player>[] {
    if (!this.research.current) return [];

    // Use all science the player has
    const scienceAmount = this.research.player.storage.amount("yieldType:science");
    const progress = new ResearchProgress(this.research, this.research.current, scienceAmount);

    // Allow defensive coding: Don't prevent invalid data from stopping the new turn
    try {
      progress.validateAction();
    } catch {
      // Remove the invalid current tech
      return [
        {
          type: "update",
          payload: { key: this.research.key, current: null },
        },
      ];
    }

    const playerMutation: PohMutation<Player> = {
      type: "setKeys",
      payload: {
        key: this.research.playerKey,
        storage: {
          "yieldType:science": 0,
        } as any, // This will tell the store to set this into the storage
      },
    };

    return [playerMutation, ...progress.handleAction()];
  }
}
