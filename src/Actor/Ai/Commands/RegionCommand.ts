import { ActionReport, Difficulty, Note, Priority, Region } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";
import { LocalCommand } from "@/Actor/Ai/Commands/LocalCommand";
import { PohAction } from "@/Common/PohAction";
import { prioritiesById } from "@/Actor/Ai/Helpers/prioritiesById";

export class RegionCommand {
  public readonly notesFromLocalities: Note[] = [];
  public readonly localCommands: Map<string, LocalCommand> = new Map();

  constructor(
    public readonly player: Player,
    public readonly difficulty: Difficulty,
    public readonly region: Region,
  ) {
    region.localities.forEach((locality) => {
      this.localCommands.set(locality.id, new LocalCommand(player, difficulty, locality));
    });
  }

  act(regionPriorities: Priority[]): ActionReport {
    const actions = [] as PohAction[];
    const notes = [] as Note[];

    // Act at the Region Level first

    // Group priorities by locality
    const prioritiesByLocality = prioritiesById(this.region.localities, regionPriorities);

    // Make each Locality act
    this.localCommands.forEach((localCommand) => {
      const actionReport = localCommand.act(
        prioritiesByLocality.get(localCommand.locality.id) ?? [],
      );
      actions.push(...actionReport.actions);
      notes.push(...actionReport.notes);
    });
    return { actions, notes };
  }
}
