import { Player } from "@/Common/Models/Player";
import { ActionReport, Difficulty, Note, Priority, Region } from "@/Actor/Ai/AiTypes";
import { Memory } from "@/Actor/Ai/Memory";
import { RegionAction } from "@/Actor/Ai/Actions/RegionAction";
import { Action } from "@/Common/IAction";
import { prioritiesById } from "@/Actor/Ai/Helpers/prioritiesById";

export class StrategyAction {
  public readonly regionActions: Map<string, RegionAction> = new Map();

  constructor(
    public readonly player: Player,
    public readonly difficulty: Difficulty,
    public readonly memory: Memory,
    public readonly regions: Set<Region>,
  ) {
    regions.forEach((region) => {
      this.regionActions.set(region.id, new RegionAction(player, difficulty, region));
    });
  }

  act(strategicPriorities: Priority[]): ActionReport {
    const actions = [] as Action[];
    const notes = [] as Note[];

    // Act at the Strategy Level first

    // Group priorities by region
    const prioritiesByRegion = prioritiesById(this.regions, strategicPriorities);

    // Make each region act
    this.regionActions.forEach((regionAction) => {
      const actionReport = regionAction.act(prioritiesByRegion.get(regionAction.region.id) ?? []);
      actions.push(...actionReport.actions);
      notes.push(...actionReport.notes);
    });

    return { actions, notes };
  }
}
