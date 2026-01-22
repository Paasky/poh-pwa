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

  toData(): PohActionData {
    return {
      actionType: this.actionType,
      playerKey: this.player.key,
      subjectKey: this.subject.key,
      timestamp: this.timestamp,
      turn: this.turn,
      index: this.index,
      name: this.name,
      targetKey: this.target?.key,
      toIndex: this.toIndex,
      typeKey: this.type?.key,
    };
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

// Units
export type Alert = PohAction & { type: "alert"; unitKey: GameKey };
export type Attack = PohAction & { type: "attack"; unitKey: GameKey; targetKey: GameKey };
export type Bombard = PohAction & { type: "bombard"; unitKey: GameKey; targetKey: GameKey };
export type Build = PohAction & { type: "build"; unitKey: GameKey; typeKey: TypeKey };
export type Demobilize = PohAction & { type: "demobilize"; unitKey: GameKey };
export type Disband = PohAction & { type: "disband"; unitKey: GameKey };
export type EndTurn = PohAction & { type: "endTurn" };
export type Explore = PohAction & { type: "explore"; unitKey: GameKey };
export type Fortify = PohAction & { type: "fortify"; unitKey: GameKey };
export type Heal = PohAction & { type: "heal"; unitKey: GameKey };
export type Mission = PohAction & {
  type: "mission";
  unitKey: GameKey;
  typeKey: TypeKey;
  targetKey: GameKey;
};
export type Mobilize = PohAction & { type: "mobilize"; unitKey: GameKey };
export type Move = PohAction & { type: "move"; unitKey: GameKey; targetKey: GameKey };
export type Pillage = PohAction & { type: "pillage"; unitKey: GameKey };
export type Rebase = PohAction & { type: "rebase"; unitKey: GameKey; targetKey: GameKey };
export type Recon = PohAction & { type: "recon"; unitKey: GameKey; targetKey: GameKey };
export type Rename = PohAction & { type: "rename"; unitKey: GameKey; name: string };
export type Skip = PohAction & { type: "skip"; unitKey: GameKey };
export type Settle = PohAction & { type: "settle"; unitKey: GameKey; tileKey?: GameKey };
export type Stop = PohAction & { type: "stop"; unitKey: GameKey };
export type Trade = PohAction & { type: "trade"; unitKey: GameKey; targetKey: GameKey };
export type Upgrade = PohAction & { type: "upgrade"; unitKey: GameKey; designKey: GameKey };

// Unit Design
export type CreateDesign = PohAction & {
  type: "createDesign";
  name: string;
  platformKey: TypeKey;
  equipmentKey: TypeKey;
};
export type DeactivateDesign = PohAction & { type: "deactivateDesign"; designKey: GameKey };
export type UpgradeDesign = PohAction & {
  type: "upgradeDesign";
  designKey: GameKey;
  name: string;
  platformKey: TypeKey;
  equipmentKey: TypeKey;
};

// City
export type StartConstruction = PohAction & {
  type: "startConstruction";
  cityKey: GameKey;
  tileKey: GameKey;
  typeKey: TypeKey;
  index: number;
};
export type OrderConstruction = PohAction & {
  type: "orderConstruction";
  cityKey: GameKey;
  index: number;
  toIndex: number;
};
export type HurryConstruction = PohAction & { type: "hurryConstruction"; cityKey: GameKey };
export type CancelConstruction = PohAction & {
  type: "cancelConstruction";
  cityKey: GameKey;
  typeKey: TypeKey;
};
export type StartTraining = PohAction & {
  type: "startTraining";
  cityKey: GameKey;
  designKey: GameKey;
  index: number;
};
export type OrderTraining = PohAction & {
  type: "orderTraining";
  cityKey: GameKey;
  index: number;
  toIndex: number;
};
export type HurryTraining = PohAction & { type: "hurryTraining"; cityKey: GameKey };
export type CancelTraining = PohAction & {
  type: "cancelTraining";
  cityKey: GameKey;
  designKey: GameKey;
};
export type MoveCitizen = PohAction & {
  type: "moveCitizen";
  citizenKey: GameKey;
  tileKey: GameKey;
};
export type PurchaseTile = PohAction & { type: "purchaseTile"; cityKey: GameKey; tileKey: GameKey };
export type RenameCity = PohAction & { type: "renameCity"; cityKey: GameKey; name: string };

// Diplomacy
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StartAgenda = PohAction & { type: "startAgenda"; payload: any }; // payload structure TBD
export type OpposeAgenda = PohAction & { type: "opposeAgenda"; agendaKey: GameKey };
export type SupportAgenda = PohAction & { type: "supportAgenda"; agendaKey: GameKey };
export type CancelAgenda = PohAction & { type: "cancelAgenda"; agendaKey: GameKey };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProposeDeal = PohAction & { type: "proposeDeal"; toPlayerKey: GameKey; payload: any }; // payload structure TBD
export type ApproveDeal = PohAction & { type: "approveDeal"; dealKey: GameKey };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NegotiateDeal = PohAction & { type: "negotiateDeal"; dealKey: GameKey; payload: any }; // payload structure TBD
export type RejectDeal = PohAction & { type: "rejectDeal"; dealKey: GameKey };

// Actor
export type SelectHeritage = PohAction & { type: "selectHeritage"; typeKey: TypeKey };
export type SelectTrait = PohAction & { type: "selectTrait"; typeKey: TypeKey };
export type SelectMyth = PohAction & { type: "selectMyth"; typeKey: TypeKey };
export type SelectGod = PohAction & { type: "selectGod"; typeKey: TypeKey };
export type SelectDogma = PohAction & { type: "selectDogma"; typeKey: TypeKey };
export type SelectPolicy = PohAction & { type: "selectPolicy"; typeKey: TypeKey };
export type SelectTechnology = PohAction & { type: "selectTechnology"; typeKey: TypeKey };
export type KeepStatusQuo = PohAction & { type: "keepStatusQuo" };
export type EnactReforms = PohAction & { type: "enactReforms" };
export type JoinRevolution = PohAction & { type: "joinRevolution" };

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
