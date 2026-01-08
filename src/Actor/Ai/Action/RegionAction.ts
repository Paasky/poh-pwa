import { ActionReport, Difficulty, Note, Priority, Region } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";
import { LocalAction } from "@/Actor/Ai/Action/LocalAction";
import { Action } from "@/Common/IAction";
import { prioritiesById } from "@/Actor/Ai/Helpers/prioritiesById";

export class RegionAction {
  public readonly notesFromLocalities: Note[] = [];
  public readonly localActions: Map<string, LocalAction> = new Map();

  constructor(
    public readonly player: Player,
    public readonly difficulty: Difficulty,
    public readonly region: Region,
  ) {
    region.localities.forEach((locality) => {
      this.localActions.set(locality.id, new LocalAction(player, difficulty, locality));
    });
  }

  act(regionPriorities: Priority[]): ActionReport {
    const actions = [] as Action[];
    const notes = [] as Note[];

    // Act at the Region Level first

    // Group priorities by locality
    const prioritiesByLocality = prioritiesById(this.region.localities, regionPriorities);

    // Make each Locality act
    this.localActions.forEach((localAction) => {
      const actionReport = localAction.act(prioritiesByLocality.get(localAction.locality.id) ?? []);
      actions.push(...actionReport.actions);
      notes.push(...actionReport.notes);
    });
    return { actions, notes };
  }
}
