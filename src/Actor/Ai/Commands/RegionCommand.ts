import {
  ActionReport,
  CanActResponse,
  Difficulty,
  Note,
  Priority,
  Region,
} from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";
import { LocalCommand } from "@/Actor/Ai/Commands/LocalCommand";
import { PohAction } from "@/Common/PohAction";
import { prioritiesById } from "@/Actor/Ai/Helpers/prioritiesById";
import { Tile } from "@/Common/Models/Tile";

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

  canAct(regionPriorities: Priority[]): CanActResponse {
    const prioritiesByLocality = prioritiesById(this.region.localities, regionPriorities);

    const localityResponses: CanActResponse[] = [];
    this.localCommands.forEach((localCommand) => {
      const response = localCommand.canAct(
        prioritiesByLocality.get(localCommand.locality.id) ?? [],
      );
      localityResponses.push(response);
    });

    const canActPriorities: Priority[] = [];
    const limitedPriorities: Priority[] = [];
    const cannotActPriorities: Priority[] = [];

    const totalUnits = localityResponses.reduce((sum, r) => sum + r.availableUnits, 0);
    const totalCities = localityResponses.reduce((sum, r) => sum + r.availableCities, 0);
    const totalIdleUnits = localityResponses.reduce((sum, r) => sum + r.idleUnits, 0);
    const totalIdleCities = localityResponses.reduce((sum, r) => sum + r.idleCities, 0);

    const aggregatedIdleUnitTiles = new Set<Tile>();
    for (const response of localityResponses) {
      for (const tile of response.idleUnitTiles) {
        aggregatedIdleUnitTiles.add(tile);
      }
    }

    for (const priority of regionPriorities) {
      const localitiesCanAct = localityResponses.filter((r) =>
        r.canActPriorities.some((p) => p.name === priority.name),
      );
      const localitiesLimited = localityResponses.filter((r) =>
        r.limitedPriorities.some((p) => p.name === priority.name),
      );

      if (localitiesCanAct.length > 0) {
        canActPriorities.push(priority);
      } else if (localitiesLimited.length > 0) {
        limitedPriorities.push(priority);
      } else {
        cannotActPriorities.push(priority);
      }
    }

    let status: "ready" | "limited" | "unable";
    if (canActPriorities.length > 0) {
      status = "ready";
    } else if (limitedPriorities.length > 0) {
      status = "limited";
    } else {
      status = "unable";
    }

    return {
      areaId: this.region.id,
      areaName: this.region.name,
      status,
      canActPriorities,
      limitedPriorities,
      cannotActPriorities,
      availableUnits: totalUnits,
      availableCities: totalCities,
      idleUnits: totalIdleUnits,
      idleCities: totalIdleCities,
      idleUnitTiles: aggregatedIdleUnitTiles,
    };
  }

  act(regionPriorities: Priority[]): ActionReport {
    const actions = [] as PohAction[];
    const notes = [] as Note[];

    const prioritiesByLocality = prioritiesById(this.region.localities, regionPriorities);

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
