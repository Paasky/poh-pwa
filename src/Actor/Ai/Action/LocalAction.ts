import { Player } from "@/Common/Models/Player";
import { ActionReport, Difficulty, Locality, Note, Priority } from "@/Actor/Ai/AiTypes";
import { Action } from "@/Common/IAction";

export class LocalAction {
  constructor(
    public readonly player: Player,
    public readonly difficulty: Difficulty,
    public readonly locality: Locality,
  ) {}

  act(localPriorities: Priority[]): ActionReport {
    const actions = [] as Action[];
    const notes = [] as Note[];

    // Decide on what actions to take based on local priorities
    return { actions, notes };
  }
}
