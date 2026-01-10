import { Player } from "@/Common/Models/Player";
import { Difficulty, Note, Priority, Region } from "@/Actor/Ai/AiTypes";
import { StrategyCommand } from "@/Actor/Ai/Commands/StrategyCommand";
import { Memory } from "@/Actor/Ai/Memory";
import { subscribe } from "@/Common/Buses/EventBus";
import { IEvent } from "@/Common/IEvent";
import { pushActions } from "@/Common/Buses/ActionBus";
import { IMindset } from "@/Actor/Ai/Mindsets/_IMindset";
import { PreSettled } from "@/Actor/Ai/Mindsets/PreSettled";
import { Vibing } from "@/Actor/Ai/Mindsets/Vibing";

export class Brain {
  public readonly eventInbox: IEvent[] = [];
  public mindset?: IMindset;
  public readonly strategyCommand: StrategyCommand;

  constructor(
    public readonly player: Player,
    public readonly difficulty: Difficulty,
    public readonly memory: Memory,
    public readonly regions: Set<Region>,
  ) {
    this.strategyCommand = new StrategyCommand(player, difficulty, memory, regions);
    subscribe(player.key, this.onEvents.bind(this));
  }

  runTurn(): void {
    const priorities = this.think();

    if (priorities.length) {
      const actionReport = this.strategyCommand.act(priorities);
      pushActions(this.player.key, actionReport.actions);
      this.ingestActionReport(actionReport.notes);
    }
  }

  // Selects a Mindset from current top-level facts and recent events
  // Uses the Mindset to analyze the current situation and return Priorities for this turn
  private think(): Priority[] {
    // The mindset is selected using current top-level facts and events that have happened since the last analysis
    this.mindset = this.selectMindset();

    // Analyze the current situation with the mindset, return Priorities for this turn
    const priorities = this.mindset.analyzeStrategy(this.eventInbox);

    // Priorities created, reset events (we've made up our mind now)
    this.eventInbox.length = 0;

    return priorities;
  }

  private selectMindset(): IMindset {
    if (this.player.culture.status !== "settled") {
      return new PreSettled(this.player, this.difficulty, this.memory, this.regions);
    }

    // todo: determine player mindset before analyzing
    // Use Data from Player, events & post action analysis to determine Mindset
    // Then inject the correct Mindsets Mindset and run it
    // const events = [...this.eventInbox];

    // default: Just Vibing
    return new Vibing(this.player, this.difficulty, this.memory, this.regions);
  }

  private ingestActionReport(notes: Note[]): void {
    // todo save to memory what went well/what went badly/what big mindset-altering events happened
  }

  private onEvents(events: IEvent[]): void {
    this.eventInbox.push(...events);
  }
}
