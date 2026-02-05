import { Priority } from "@/Actor/Ai/AiTypes";
import { PohEvent } from "@/Common/PohEvent";

export interface IMindset {
  analyzeStrategy(events: PohEvent[]): Priority[];
}
