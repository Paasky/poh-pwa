import { GameKey } from "@/objects/game/_GameObject";
import { TypeKey } from "@/types/common";

export type ActionType =
  // Units
  | "alert"
  | "attack"
  | "bombard"
  | "build"
  | "demobilize"
  | "disband"
  | "endTurn"
  | "explore"
  | "fortify"
  | "heal"
  | "mission"
  | "mobilize"
  | "move"
  | "pillage"
  | "rebase"
  | "recon"
  | "rename"
  | "skip"
  | "settle"
  | "stop"
  | "trade"
  | "upgrade"

  // Unit Design
  | "createDesign"
  | "deactivateDesign"
  | "upgradeDesign"

  // City
  | "startBuilding"
  | "hurryBuilding"
  | "cancelBuilding"
  | "startTraining"
  | "hurryTraining"
  | "cancelTraining"
  | "moveCitizen"
  | "purchaseTile"
  | "renameCity"

  // Diplomacy
  | "startAgenda"
  | "opposeAgenda"
  | "supportAgenda"
  | "cancelAgenda"
  | "proposeDeal"
  | "approveDeal"
  | "rejectDeal"

  // Player
  | "selectHeritage"
  | "selectTrait"
  | "unselectTrait"
  | "selectMyth"
  | "selectGod"
  | "selectDogma"
  | "selectPolicy"
  | "selectTechnology"
  | "enactReforms"
  | "joinRevolution"
  | "keepStatusQuo";

export const ActionHotkey = {
  a: "alert",
  b: "build",
  D: "demobilize",
  d: "disband",
  e: "explore",
  f: "fortify",
  h: "heal",
  m: "mission",
  M: "mobilize",
  p: "pillage",
  R: "rebase",
  r: "recon",
  N: "rename",
  s: "settle",
  t: "trade",
  u: "upgrade",
  x: "stop",
  enter: "endTurn",
  space: "skip",
} as Record<string, ActionType>;

export interface IAction {
  type: ActionType;

  /**
   * The world tick/version this action was based on.
   * Used for optimistic locking/conflict resolution in multiplayer.
   */
  turn: number;

  /**
   * Client-side timestamp when the action was created.
   */
  timestamp: number;
}

// Units
export type Alert = IAction & { type: "alert"; unitKey: GameKey };
export type Attack = IAction & { type: "attack"; unitKey: GameKey; targetKey: GameKey };
export type Bombard = IAction & { type: "bombard"; unitKey: GameKey; targetKey: GameKey };
export type Build = IAction & { type: "build"; unitKey: GameKey; typeKey: TypeKey };
export type Demobilize = IAction & { type: "demobilize"; unitKey: GameKey };
export type Disband = IAction & { type: "disband"; unitKey: GameKey };
export type EndTurn = IAction & { type: "endTurn" };
export type Explore = IAction & { type: "explore"; unitKey: GameKey };
export type Fortify = IAction & { type: "fortify"; unitKey: GameKey };
export type Heal = IAction & { type: "heal"; unitKey: GameKey };
export type Mission = IAction & {
  type: "mission";
  unitKey: GameKey;
  typeKey: TypeKey;
  targetKey: GameKey;
};
export type Mobilize = IAction & { type: "mobilize"; unitKey: GameKey };
export type Move = IAction & { type: "move"; unitKey: GameKey; targetKey: GameKey };
export type Pillage = IAction & { type: "pillage"; unitKey: GameKey };
export type Rebase = IAction & { type: "rebase"; unitKey: GameKey; targetKey: GameKey };
export type Recon = IAction & { type: "recon"; unitKey: GameKey; targetKey: GameKey };
export type Rename = IAction & { type: "rename"; unitKey: GameKey; name: string };
export type Skip = IAction & { type: "skip"; unitKey: GameKey };
export type Settle = IAction & { type: "settle"; unitKey: GameKey };
export type Stop = IAction & { type: "stop"; unitKey: GameKey };
export type Trade = IAction & { type: "trade"; unitKey: GameKey; targetKey: GameKey }; // target could be city or unit
export type Upgrade = IAction & { type: "upgrade"; unitKey: GameKey; targetKey: GameKey };

// Unit Design
export type CreateDesign = IAction & {
  type: "createDesign";
  name: string;
  platformKey: TypeKey;
  equipmentKey: TypeKey;
};
export type DeactivateDesign = IAction & { type: "deactivateDesign"; designKey: GameKey };
export type UpgradeDesign = IAction & {
  type: "upgradeDesign";
  designKey: GameKey;
  name: string;
  platformKey: TypeKey;
  equipmentKey: TypeKey;
};

// City
export type StartBuilding = IAction & { type: "startBuilding"; cityKey: GameKey; typeKey: TypeKey };
export type HurryBuilding = IAction & { type: "hurryBuilding"; cityKey: GameKey };
export type CancelBuilding = IAction & {
  type: "cancelBuilding";
  cityKey: GameKey;
  typeKey: TypeKey;
};
export type StartTraining = IAction & {
  type: "startTraining";
  cityKey: GameKey;
  designKey: GameKey;
};
export type HurryTraining = IAction & { type: "hurryTraining"; cityKey: GameKey };
export type CancelTraining = IAction & {
  type: "cancelTraining";
  cityKey: GameKey;
  designKey: GameKey;
};
export type MoveCitizen = IAction & { type: "moveCitizen"; citizenKey: GameKey; tileKey: GameKey };
export type PurchaseTile = IAction & { type: "purchaseTile"; cityKey: GameKey; tileKey: GameKey };
export type RenameCity = IAction & { type: "renameCity"; cityKey: GameKey; name: string };

// Diplomacy
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StartAgenda = IAction & { type: "startAgenda"; payload: any }; // payload structure TBD
export type OpposeAgenda = IAction & { type: "opposeAgenda"; agendaKey: GameKey };
export type SupportAgenda = IAction & { type: "supportAgenda"; agendaKey: GameKey };
export type CancelAgenda = IAction & { type: "cancelAgenda"; agendaKey: GameKey };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProposeDeal = IAction & { type: "proposeDeal"; toPlayerKey: GameKey; payload: any }; // payload structure TBD
export type ApproveDeal = IAction & { type: "approveDeal"; dealKey: GameKey };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NegotiateDeal = IAction & { type: "negotiateDeal"; dealKey: GameKey; payload: any }; // payload structure TBD
export type RejectDeal = IAction & { type: "rejectDeal"; dealKey: GameKey };

// Player
export type SelectHeritage = IAction & { type: "selectHeritage"; typeKey: TypeKey };
export type SelectTrait = IAction & { type: "selectTrait"; typeKey: TypeKey };
export type SelectMyth = IAction & { type: "selectMyth"; typeKey: TypeKey };
export type SelectGod = IAction & { type: "selectGod"; typeKey: TypeKey };
export type SelectDogma = IAction & { type: "selectDogma"; typeKey: TypeKey };
export type SelectPolicy = IAction & { type: "selectPolicy"; typeKey: TypeKey };
export type SelectTechnology = IAction & { type: "selectTechnology"; typeKey: TypeKey };
export type KeepStatusQuo = IAction & { type: "keepStatusQuo" };
export type EnactReforms = IAction & { type: "enactReforms" };
export type JoinRevolution = IAction & { type: "joinRevolution" };

export type Action =
  | Alert
  | Attack
  | Bombard
  | Build
  | Demobilize
  | Disband
  | EndTurn
  | Explore
  | Fortify
  | Heal
  | Mission
  | Mobilize
  | Move
  | Pillage
  | Rebase
  | Recon
  | Rename
  | Skip
  | Settle
  | Stop
  | Trade
  | Upgrade
  | CreateDesign
  | DeactivateDesign
  | UpgradeDesign
  | StartBuilding
  | HurryBuilding
  | CancelBuilding
  | StartTraining
  | HurryTraining
  | CancelTraining
  | MoveCitizen
  | PurchaseTile
  | RenameCity
  | StartAgenda
  | OpposeAgenda
  | SupportAgenda
  | CancelAgenda
  | ProposeDeal
  | ApproveDeal
  | NegotiateDeal
  | RejectDeal
  | SelectHeritage
  | SelectTrait
  | SelectMyth
  | SelectGod
  | SelectDogma
  | SelectPolicy
  | SelectTechnology
  | KeepStatusQuo
  | EnactReforms
  | JoinRevolution;
