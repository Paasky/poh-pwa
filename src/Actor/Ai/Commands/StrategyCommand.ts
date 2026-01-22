import { Player } from "@/Common/Models/Player";
import { ActionReport, Difficulty, Note, Priority, Region } from "@/Actor/Ai/AiTypes";
import { Memory } from "@/Actor/Ai/Memory";
import { RegionCommand } from "@/Actor/Ai/Commands/RegionCommand";
import { Action } from "@/Common/PohAction";
import { prioritiesById } from "@/Actor/Ai/Helpers/prioritiesById";

export class StrategyCommand {
  public readonly regionCommands: Map<string, RegionCommand> = new Map();

  constructor(
    public readonly player: Player,
    public readonly difficulty: Difficulty,
    public readonly memory: Memory,
    public readonly regions: Set<Region>,
  ) {
    regions.forEach((region) => {
      this.regionCommands.set(region.id, new RegionCommand(player, difficulty, region));
    });
  }

  act(strategicPriorities: Priority[]): ActionReport {
    const actions = [] as Action[];
    const notes = [] as Note[];

    // Act at the Strategy Level first

    // Group priorities by region
    const prioritiesByRegion = prioritiesById(this.regions, strategicPriorities);

    // Make each region act
    this.regionCommands.forEach((regionCommand) => {
      const actionReport = regionCommand.act(prioritiesByRegion.get(regionCommand.region.id) ?? []);
      actions.push(...actionReport.actions);
      notes.push(...actionReport.notes);
    });

    return { actions, notes };
  }
}
