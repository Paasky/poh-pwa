import { Note, Priority } from "@/Actor/Ai/AiTypes";

export interface IBrain {
  analyze(): Note[];
  act(priorities: Priority[]): Note[];
}