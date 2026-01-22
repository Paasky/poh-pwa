import { Priority } from "@/Actor/Ai/AiTypes";
import { IEvent } from "@/Common/PohEvent";

export interface IMindset {
  analyzeStrategy(events: IEvent[]): Priority[];
}
