import { Player } from "@/Common/Models/Player";
import {
  ActionReport,
  CanActResponse,
  Difficulty,
  Note,
  Priority,
  Region,
} from "@/Actor/Ai/AiTypes";
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

  act(strategicPriorities: Priority[]): ActionReport {
    const actions = [] as PohAction[];
    const notes = [] as Note[];

    const prioritiesByRegion = prioritiesById(this.regions, strategicPriorities);

    const regionResponses: CanActResponse[] = [];
    this.regionCommands.forEach((regionCommand) => {
      const response = regionCommand.canAct(prioritiesByRegion.get(regionCommand.region.id) ?? []);
      regionResponses.push(response);
    });

    const adjustedPriorities = this.adjustPriorities(strategicPriorities, regionResponses);

    const reinforcementPriorities = this.createReinforcementPriorities(regionResponses);

    const finalPriorities = [...adjustedPriorities, ...reinforcementPriorities];

    const finalPrioritiesByRegion = prioritiesById(this.regions, finalPriorities);

    this.regionCommands.forEach((regionCommand) => {
      const actionReport = regionCommand.act(
        finalPrioritiesByRegion.get(regionCommand.region.id) ?? [],
      );
      actions.push(...actionReport.actions);
      notes.push(...actionReport.notes);
    });

    this.generateStrategicNotes(regionResponses, notes);

    return { actions, notes };
  }

  private adjustPriorities(
    originalPriorities: Priority[],
    regionResponses: CanActResponse[],
  ): Priority[] {
    const adjusted: Priority[] = [];

    for (const priority of originalPriorities) {
      const regionsCanAct = regionResponses.filter((r) =>
        r.canActPriorities.some((p: Priority) => p.name === priority.name),
      );
      const regionsLimited = regionResponses.filter((r) =>
        r.limitedPriorities.some((p: Priority) => p.name === priority.name),
      );
      const regionsCannotAct = regionResponses.filter((r) =>
        r.cannotActPriorities.some((p: Priority) => p.name === priority.name),
      );

      if (regionsCanAct.length === 0 && regionsLimited.length === 0) {
        continue;
      }

      if (regionsLimited.length > 0 && regionsCanAct.length === 0) {
        adjusted.push({
          ...priority,
          importance: Math.max(1, priority.importance - 1) as 1 | 2 | 3 | 4 | 5,
        });
      } else {
        adjusted.push(priority);
      }

      if (priority.areaId && regionsCannotAct.some((r) => r.areaId === priority.areaId)) {
        const alternativeRegion = regionsCanAct.find((r) => r.areaId !== priority.areaId);
        if (alternativeRegion) {
          adjusted.push({
            ...priority,
            name: `${priority.name} (redirected to ${alternativeRegion.areaName})`,
            areaId: alternativeRegion.areaId,
            importance: Math.max(1, priority.importance - 1) as 1 | 2 | 3 | 4 | 5,
          });
        }
      }
    }

    return adjusted;
  }

  private createReinforcementPriorities(regionResponses: CanActResponse[]): Priority[] {
    const reinforcements: Priority[] = [];

    const surplusRegions = regionResponses.filter((r) => r.idleUnits > 0 && r.status === "ready");
    const deficitRegions = regionResponses.filter(
      (r) => r.status === "limited" || r.cannotActPriorities.length > 0,
    );

    if (surplusRegions.length === 0 || deficitRegions.length === 0) {
      return reinforcements;
    }

    surplusRegions.sort((a, b) => b.idleUnits - a.idleUnits);
    deficitRegions.sort((a, b) => b.cannotActPriorities.length - a.cannotActPriorities.length);

    for (const deficitRegion of deficitRegions) {
      if (surplusRegions.length === 0) break;

      const surplusRegion = surplusRegions[0];

      if (surplusRegion.idleUnits > 0) {
        reinforcements.push({
          name: `Reinforce ${deficitRegion.areaName} from ${surplusRegion.areaName}`,
          importance: 3,
          emphases: [
            {
              category: "capability",
              value: Math.min(100, surplusRegion.idleUnits * 15),
              reasons: [
                {
                  type: "idleUnit",
                  value: Math.min(100, surplusRegion.idleUnits * 15),
                },
              ],
            },
          ],
          mapAction: "reinforce",
          areaId: deficitRegion.areaId,
        });

        surplusRegion.idleUnits--;
        if (surplusRegion.idleUnits === 0) {
          surplusRegions.shift();
        }
      }
    }

    return reinforcements;
  }

  private generateStrategicNotes(regionResponses: CanActResponse[], notes: Note[]): void {
    const totalIdleUnits = regionResponses.reduce((sum, r) => sum + r.idleUnits, 0);
    const totalIdleCities = regionResponses.reduce((sum, r) => sum + r.idleCities, 0);

    if (totalIdleUnits > 0) {
      notes.push({
        name: `${totalIdleUnits} idle units across all regions`,
        importance: Math.min(5, Math.floor(totalIdleUnits / 2) + 1) as 1 | 2 | 3 | 4 | 5,
        emphasis: {
          category: "capability",
          value: Math.min(100, totalIdleUnits * 10),
          reasons: [
            {
              type: "idleUnit",
              value: Math.min(100, totalIdleUnits * 10),
            },
          ],
        },
      });
    }

    if (totalIdleCities > 0) {
      notes.push({
        name: `${totalIdleCities} idle cities across all regions`,
        importance: Math.min(5, Math.floor(totalIdleCities / 2) + 2) as 1 | 2 | 3 | 4 | 5,
        emphasis: {
          category: "gain",
          value: Math.min(100, totalIdleCities * 20),
          reasons: [
            {
              type: "emptyQueue",
              value: Math.min(100, totalIdleCities * 20),
            },
          ],
        },
      });
    }

    const unableRegions = regionResponses.filter((r) => r.status === "unable");
    if (unableRegions.length > 0) {
      notes.push({
        name: `${unableRegions.length} regions unable to act: ${unableRegions.map((r) => r.areaName).join(", ")}`,
        importance: 2,
        emphasis: {
          category: "capability",
          value: 30,
          reasons: [
            {
              type: "idleUnit",
              value: 30,
            },
          ],
        },
      });
    }
  }
}
