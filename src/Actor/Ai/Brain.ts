import { Player } from "@/Common/Models/Player";
import { Difficulty, Note, Priority, Region } from "@/Actor/Ai/AiTypes";
import { StrategyAction } from "@/Actor/Ai/Action/StrategyAction";
import { Memory } from "@/Actor/Ai/Memory";
import { subscribe } from "@/Common/EventBus";
import { IEvent } from "@/Common/IEvent";
import { pushActions } from "@/Common/ActionBus";
import { IAnalysisMindset } from "@/Actor/Ai/Analysis/_IAnalysisMindset";
import { PreSettled } from "@/Actor/Ai/Analysis/PreSettled";
import { Vibing } from "@/Actor/Ai/Analysis/Vibing";

export class Brain {
  public readonly eventsSinceLastAnalysis: IEvent[] = [];
  public readonly notesFromRegion: Note[] = [];
  public analysisMindset!: IAnalysisMindset;
  public readonly strategyAction: StrategyAction;

  constructor(
    public readonly player: Player,
    public readonly difficulty: Difficulty,
    public readonly memory: Memory,
    public readonly regions: Set<Region>,
  ) {
    this.strategyAction = new StrategyAction(player, difficulty, memory, regions);
    subscribe(player.key, this.onEvents.bind(this));
  }

  onEvents(events: IEvent[]): void {
    this.eventsSinceLastAnalysis.push(...events);
  }

  runTurn(): void {
    const priorities = this.analyze();

    if (priorities.length) {
      const actResponse = this.strategyAction.act(priorities);
      pushActions(this.player.key, actResponse.actions);
      this.postActionAnalysis(actResponse.notes);
    }
  }

  analyze(): Priority[] {
    this.notesFromRegion.length = 0;

    this.analysisMindset = this.selectMindset();

    return this.analysisMindset.analyzeStrategy(this.memory);
  }

  selectMindset(): IAnalysisMindset {
    if (this.player.culture.status !== "settled") {
      // Don't bother with events
      this.eventsSinceLastAnalysis.length = 0;

      return new PreSettled(this.player, this.difficulty, this.memory, this.regions);
    }

    // todo: determine player state before analyzing
    // Use Data from Player, events & post action analysis to determine Mindset
    // Then inject the correct Analysis Mindset and run it
    const events = [...this.eventsSinceLastAnalysis];
    this.eventsSinceLastAnalysis.length = 0;

    // default: Just Vibing
    return new Vibing(this.player, this.difficulty, this.memory, this.regions);
  }

  postActionAnalysis(notes: Note[]): void {
    // todo save to memory what went well/what went badly/what big mindset-altering events happened
  }
}
