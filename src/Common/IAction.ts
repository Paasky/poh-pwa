import z from "zod";
import { GameKey, GameObject } from "@/Common/Models/_GameModel";
import { TypeKey } from "@/Common/Static/StaticEnums";
import { Player } from "@/Common/Models/Player";
import { TypeObject } from "@/Common/Static/Objects/TypeObject";
import { useDataBucket } from "@/Data/useDataBucket";
import { gameKeySchema, typeKeySchema } from "@/Common/Validation";

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

export class PohAction {
  readonly actionType: ActionType;
  readonly player: Player;
  readonly subject: GameObject;
  readonly timestamp: number;
  readonly turn: number;

  readonly index?: number;
  readonly name?: string;
  readonly target?: GameObject;
  readonly toIndex?: number;
  readonly type?: TypeObject;
  readonly types?: TypeObject[];

  constructor(
    actionType: ActionType,
    player: Player,
    subject: GameObject,
    timestamp: number,
    turn: number,
    opts?: {
      index?: number;
      name?: string;
      target?: GameObject;
      toIndex?: number;
      type?: TypeObject;
    },
  ) {
    this.actionType = actionType;
    this.player = player;
    this.turn = turn;
    this.timestamp = timestamp;
    this.subject = subject;
    this.index = opts?.index;
    this.name = opts?.name;
    this.target = opts?.target;
    this.toIndex = opts?.toIndex;
    this.type = opts?.type;
  }

  static fromData(data: PohActionData): PohAction {
    const bucket = useDataBucket();

    return new PohAction(
      data.actionType as ActionType,
      bucket.getObject<Player>(data.playerKey),
      bucket.getObject(data.subjectKey),
      data.timestamp,
      data.turn,
      {
        index: data.index,
        name: data.name,
        target: data.targetKey ? bucket.getObject(data.targetKey) : undefined,
        toIndex: data.toIndex,
        type: data.typeKey ? bucket.getType(data.typeKey) : undefined,
      },
    );
  }
}

export const PohActionSchema = z.object({
  actionType: typeKeySchema(["actionType"]),
  playerKey: gameKeySchema(["player"]),
  turn: z.number().int(),
  timestamp: z.number(),
  subjectKey: gameKeySchema(),
  index: z.number().int().optional(),
  name: z.string().optional(),
  targetKey: gameKeySchema().optional(),
  toIndex: z.number().int().optional(),
  typeKey: typeKeySchema().optional(),
});

export type PohActionData = z.infer<typeof PohActionSchema>;

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
