import { Tile } from "@/Common/Models/Tile";
import { Memory } from "@/Actor/Ai/Memory";
import { IAction } from "@/Common/IAction";
import { GameKey } from "@/Common/Models/_GameTypes";
import { Requires } from "@/Common/Static/Objects/Requires";

export type CityAction = "start" | "hurry" | "queue" | "prioritize";
export type MapAction =
  | "improve"
  | "settle"
  | "route"
  | "fortify"
  | "airbase"
  | "explore"
  | "posture"
  | "attack"
  | "defend"
  | "retreat"
  | "reinforce";

export type Difficulty = "easy" | "regular" | "hard" | "brutal";
export type Tension = "safe" | "calm" | "suspicious" | "violence";

export type EmphasisCategory =
  | "risk" // enemyMilitary, tension, ourValueTile
  | "reward" // unknownTile, agendaTarget, wonderAvailable
  | "urgency" // siege, diplomacyTimer, tension
  | "capability" // ourMilitary, ourAgents, ourCulture, ourFaith, idleUnit
  | "gain" // unusedResource, unimprovedLand, goodSettleTile, emptyQueue
  | "deny"; // enemyAgenda, enemyValueTile, chokepoint

export type EmphasisType =
  | "enemyMilitary" // risk
  | "tension" // risk, urgency
  | "ourValueTile" // risk
  | "unknownTile" // reward
  | "agendaTarget" // reward
  | "wonderAvailable" // reward
  | "siege" // urgency
  | "diplomacyTimer" // urgency
  | "ourMilitary" // capability
  | "ourAgents" // capability
  | "ourCulture" // capability
  | "ourFaith" // capability
  | "idleUnit" // capability
  | "unusedResource" // gain
  | "unimprovedLand" // gain
  | "emptyQueue" // gain
  | "goodSettleTile" // gain
  | "enemyAgenda" // deny
  | "enemyValueTile" // deny
  | "chokepoint"; // deny

export type EmphasisReason = {
  type: EmphasisType;
  value: number; // 0-100
  gameKeys?: GameKey[];
};

export type CategoryEmphasis = {
  category: EmphasisCategory;
  value: number; // 0–100
  reasons: EmphasisReason[];
};

export type Note = {
  name: string;
  importance: 1 | 2 | 3 | 4 | 5; // 1 = can ignore, 5 = must be dealt with (max one 5 per Note-list)
  emphasis: CategoryEmphasis;
};

export type Priority = {
  name: string;
  importance: 1 | 2 | 3 | 4 | 5; // 1 = can ignore, 5 = must be dealt with (max one 5 per Note-list)
  emphases: CategoryEmphasis[];
  cityAction?: CityAction;
  mapAction?: MapAction;
  requires?: Requires;
  targetRequires?: Requires;
};

export type ActionReport = {
  actions: IAction[];
  notes: Note[];
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
