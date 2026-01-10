import { Priority } from "@/Actor/Ai/AiTypes";
import { IEvent } from "@/Common/IEvent";

export interface IMindset {
  analyzeStrategy(events: IEvent[]): Priority[];
}
