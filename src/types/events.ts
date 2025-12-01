import { GameObject, Player } from "@/objects/game/gameObjects";

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
  target: GameObject;
  title: string;
  description?: string;
  read: boolean;
};
