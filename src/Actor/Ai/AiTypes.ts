import { Tile } from "@/Common/Models/Tile";
import { Memory } from "@/Actor/Ai/Memory";
import { Action } from "@/Common/IAction";

export type LandAction = "improve" | "resource" | "route" | "fortify";
export type MilitaryAction =
  | "explore"
  | "posture"
  | "attack"
  | "defend"
  | "retreat"
  | "reinforce"
  | "reduce";

export type Difficulty = "easy" | "regular" | "hard" | "brutal";
export type Tension = "safe" | "calm" | "suspicious" | "violence";

export type ActionReport = {
  actions: Action[];
  notes: Note[];
};

export type Note = {
  name: string;
  landAction?: LandAction;
  militaryAction?: MilitaryAction;
};

export type Priority = {
  importance: 1 | 2 | 3; // 1 = lowest, 3 = highest
  landAction?: LandAction;
  militaryAction?: MilitaryAction;
};

export type Locality = {
  id: string;
  name: string;
  neighbors: Locality[];
  tension?: Tension;
  tiles: Set<Tile>;
};

export type Region = {
  id: string;
  name: string;
  memory: Memory;
  localities: Set<Locality>;
};
