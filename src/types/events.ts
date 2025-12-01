import { GameObject } from "@/objects/game/_GameObject";
import { Player } from "@/objects/game/Player";
import { PohObject } from "@/types/common";

export type EventType =
  | "settled"
  | "cultureEvolved"
  | "technologyDiscovered"
  | "eraEntered"
  | "unitKilled"
  | "unitHealed";
export type EventSetting = "ignore" | "summary" | "full";

export type GameEvent = {
  id: string;
  type: EventType;
  player?: Player;
  target: PohObject | GameObject;
  title: string;
  description?: string;
  read: boolean;
};
