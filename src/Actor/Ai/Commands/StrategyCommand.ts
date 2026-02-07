import { Player } from "@/Common/Models/Player";
import { ActionReport, Difficulty, Note, Priority, Region } from "@/Actor/Ai/AiTypes";
import { Memory } from "@/Actor/Ai/Memory";
import { RegionCommand } from "@/Actor/Ai/Commands/RegionCommand";
import { PohAction } from "@/Common/PohAction";
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

  act(priorities: Priority[]): ActionReport {
    const actions = [] as PohAction[];
    const notes = [] as Note[];

    // Group priorities by region
    const prioritiesByRegion = prioritiesById(this.regions, priorities);

    // todo: ask each region if they can act according to their priorities
    // regionCommand.canAct(priorities)
    // response can have 1-n of: ok / need orders (no prios given/can't comply) / need help (with map actions) / free units (units are idle, with units)

    // Make each region act
    this.regionCommands.forEach((regionCommand) => {
      const actionReport = regionCommand.act(prioritiesByRegion.get(regionCommand.region.id) ?? []);
      actions.push(...actionReport.actions);
      notes.push(...actionReport.notes);
    });

    return { actions, notes };
  }
}
