import { GameKey } from "@/Common/Models/_GameModel";
import { TypeKey } from "@/Common/Objects/World";

export type ActionType =
  // Units
  | "actionType:alert"
  | "actionType:attack"
  | "actionType:bombard"
  | "actionType:build"
  | "actionType:clean"
  | "actionType:clear"
  | "actionType:demobilize"
  | "actionType:disband"
  | "actionType:endTurn"
  | "actionType:explore"
  | "actionType:fortify"
  | "actionType:heal"
  | "actionType:mission"
  | "actionType:mobilize"
  | "actionType:move"
  | "actionType:pillage"
  | "actionType:rebase"
  | "actionType:recon"
  | "actionType:rename"
  | "actionType:skipTurn"
  | "actionType:settle"
  | "actionType:stop"
  | "actionType:trade"
  | "actionType:upgrade"

  // Unit Design
  | "actionType:createDesign"
  | "actionType:deactivateDesign"
  | "actionType:upgradeDesign"

  // City
  | "actionType:cityBombard"
  | "actionType:startConstruction"
  | "actionType:orderConstruction"
  | "actionType:hurryConstruction"
  | "actionType:cancelConstruction"
  | "actionType:startTraining"
  | "actionType:orderTraining"
  | "actionType:hurryTraining"
  | "actionType:cancelTraining"
  | "actionType:moveCitizen"
  | "actionType:purchaseTile"
  | "actionType:renameCity"
  | "actionType:levyUnit"

  // Diplomacy
  | "actionType:startAgenda"
  | "actionType:opposeAgenda"
  | "actionType:supportAgenda"
  | "actionType:cancelAgenda"
  | "actionType:proposeDeal"
  | "actionType:approveDeal"
  | "actionType:rejectDeal"

  // Actor
  | "actionType:selectHeritage"
  | "actionType:selectTrait"
  | "actionType:unselectTrait"
  | "actionType:selectMyth"
  | "actionType:selectGod"
  | "actionType:selectDogma"
  | "actionType:selectPolicy"
  | "actionType:selectTechnology"
  | "actionType:enactReforms"
  | "actionType:joinRevolution"
  | "actionType:keepStatusQuo";

export const ActionHotkey = {
  a: "actionType:alert",
  b: "actionType:build",
  D: "actionType:demobilize",
  d: "actionType:disband",
  e: "actionType:explore",
  f: "actionType:fortify",
  h: "actionType:heal",
  m: "actionType:mission",
  M: "actionType:mobilize",
  p: "actionType:pillage",
  R: "actionType:rebase",
  r: "actionType:recon",
  N: "actionType:rename",
  s: "actionType:settle",
  t: "actionType:trade",
  u: "actionType:upgrade",
  x: "actionType:stop",
  enter: "actionType:endTurn",
  space: "actionType:skipTurn",
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

  citizenKey?: GameKey;
  cityKey?: GameKey;
  designKey?: GameKey;
  equipmentKey?: TypeKey;
  index?: number;
  toIndex?: number;
  name?: string;
  platformKey?: TypeKey;
  targetKey?: GameKey;
  tileKey?: GameKey;
  typeKey?: TypeKey;
  unitKey?: GameKey;
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
export type Settle = IAction & { type: "settle"; unitKey: GameKey; tileKey?: GameKey };
export type Stop = IAction & { type: "stop"; unitKey: GameKey };
export type Trade = IAction & { type: "trade"; unitKey: GameKey; targetKey: GameKey };
export type Upgrade = IAction & { type: "upgrade"; unitKey: GameKey; designKey: GameKey };

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
export type StartConstruction = IAction & {
  type: "startConstruction";
  cityKey: GameKey;
  tileKey: GameKey;
  typeKey: TypeKey;
  index: number;
};
export type OrderConstruction = IAction & {
  type: "orderConstruction";
  cityKey: GameKey;
  index: number;
  toIndex: number;
};
export type HurryConstruction = IAction & { type: "hurryConstruction"; cityKey: GameKey };
export type CancelConstruction = IAction & {
  type: "cancelConstruction";
  cityKey: GameKey;
  typeKey: TypeKey;
};
export type StartTraining = IAction & {
  type: "startTraining";
  cityKey: GameKey;
  designKey: GameKey;
  index: number;
};
export type OrderTraining = IAction & {
  type: "orderTraining";
  cityKey: GameKey;
  index: number;
  toIndex: number;
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

// Actor
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
  | StartConstruction
  | OrderConstruction
  | HurryConstruction
  | CancelConstruction
  | StartTraining
  | OrderTraining
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
