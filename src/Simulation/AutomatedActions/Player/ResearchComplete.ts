import { Research } from "@/Common/Models/Research";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { PohMutation } from "@/Common/PohMutation";
import { TypeObject } from "@/Common/Objects/TypeObject";

export class ResearchComplete implements ISimAction {
  constructor(
    private readonly research: Research,
    private readonly tech: TypeObject,
  ) {}

  validateAction(): this {
    if (this.research.researched.has(this.tech))
      throw new Error(`${this.tech.name} is already researched`);
    return this;
  }

  handleAction(): PohMutation<Research>[] {
    const mutations: PohMutation<Research>[] = [
      {
        type: "append",
        payload: {
          key: this.research.key,
          researched: [this.tech] as any, // This will tell the store to append the tech into researched-Set
        },
      },
    ];

    if (this.research.queue.includes(this.tech)) {
      // Filter queue to be without the completed tech
      mutations.push({
        type: "filter",
        payload: {
          key: this.research.key,
          queue: [this.tech],
        },
      });
    }

    if (this.research.current === this.tech) {
      mutations.push({
        // Update current to be the next in queue (that is not the completed tech)
        type: "update",
        payload: {
          key: this.research.key,
          current:
            this.research.queue[0]?.key === this.tech.key
              ? this.research.queue[1]
              : this.research.queue[0],
        },
      });
    }

    return mutations;
  }
}
