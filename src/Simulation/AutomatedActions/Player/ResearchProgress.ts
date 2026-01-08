import { Research } from "@/Common/Models/Research";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { IMutation } from "@/Common/IMutation";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { roundToTenth } from "@/Common/Objects/Common";
import { Player } from "@/Common/Models/Player";
import { ResearchComplete } from "@/Simulation/AutomatedActions/Player/ResearchComplete";

export class ResearchProgress implements ISimAction {
  constructor(private readonly research: Research, private readonly tech:TypeObject, private readonly amount:number) {}

  validateAction(): this {
    if (this.research.researched.has(this.tech)) throw new Error(`${this.tech.name} is already researched`);
    return this;
  }

  handleAction(): IMutation<Research|Player>[] {
    const progress = roundToTenth(this.research.getProgress(this.tech) + this.amount);

    // Did it complete?
    if (progress >= this.tech.scienceCost!) {
      const mutations = new ResearchComplete(this.research, this.tech).handleAction();

      const overflow = roundToTenth(progress - this.tech.scienceCost!);
      const playerMutation: IMutation<Player> = {
        type: "setKeys",
        payload: {
          key: this.research.playerKey,
          storage: {
            "yieldType:science": overflow,
          } as any, // This will tell the store to set the science overflow into the storage
        },
      };

      return [...mutations, playerMutation];
    }

    // Did not complete yet: just add progress to the payload storage
    return[{
      type: "setKeys",
      payload: {
        key: this.research.key,
        storage: {
          [this.tech.key]: progress,
        } as any, // This will tell the store to set the science progress into the storage
      },
    }];
  }
}
