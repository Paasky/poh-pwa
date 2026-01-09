import { Locality, Note, Priority, Region } from "@/Actor/Ai/AiTypes";
import { Memory } from "@/Actor/Ai/Memory";

export interface IAnalysisMindset {
  analyzeLocality(locality: Locality): Note[];
  analyzeRegion(region: Region): Note[];
  analyzeStrategy(memory: Memory): Priority[];
}
