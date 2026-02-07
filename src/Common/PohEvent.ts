import z from "zod";
import { GameObject } from "@/Common/Models/_GameModel";
import { PohMutation, PohMutationSchema } from "@/Common/PohMutation";
import { PohAction, PohActionSchema } from "@/Common/PohAction";
import { TypeObject } from "@/Common/Static/Objects/TypeObject";
import { useDataBucket } from "@/Data/useDataBucket";
import { Player } from "@/Common/Models/Player";
import { gameKeySchema, typeKeySchema } from "@/Common/Validation";

export class PohEvent {
  readonly key: string;
  readonly turn: number;
  readonly title: string;
  readonly subject: GameObject;

  readonly mutations: PohMutation<GameObject>[];
  readonly players: Player[];
  readonly relatesTo: GameObject[];

  readonly action?: PohAction;
  readonly description?: string;
  readonly isLocal: boolean;
  readonly type?: TypeObject;

  // For UI
  isRead?: boolean;

  constructor(
    subject: GameObject, // What is this event about?
    title: string,
    turn: number,

    opts: {
      key?: string;
      action?: PohAction; // What Action caused the event?
      description?: string;
      isLocal?: boolean; // Event came from local or from a host (host event mutations must be applied to local store)
      mutations?: PohMutation<GameObject>[]; // What mutations happened with the event?
      players?: Player[]; // Who knows about the event? (empty = everyone)
      relatesTo?: GameObject[]; // What other objects are related to this event?
      type?: TypeObject;
    },
  ) {
    this.key = opts.key ?? crypto.randomUUID();
    this.subject = subject;
    this.title = title;
    this.turn = turn;

    this.mutations = opts.mutations ?? [];
    this.players = opts.players ?? [];
    this.relatesTo = opts.relatesTo ?? [];

    this.action = opts.action;
    this.description = opts.description;
    this.isLocal = opts.isLocal ?? false;
    this.type = opts.type;
  }

  static fromData(data: PohEventData): PohEvent {
    const bucket = useDataBucket();

    return new PohEvent(bucket.getObject(data.subjectKey), data.title, data.turn, {
      mutations: data.mutations?.map((m) => PohMutation.fromData(m)),
      players: data.playerKeys?.map((key) => bucket.getObject<Player>(key)),
      relatesTo: data.relatesToKeys?.map((key) => bucket.getObject(key)),

      action: data.action ? PohAction.fromData(data.action) : undefined,
      description: data.description,
      isLocal: data.isLocal ?? false,
      type: data.typeKey ? bucket.getType(data.typeKey) : undefined,
    });
  }

  toData(): PohEventData {
    return {
      subjectKey: this.subject.key,
      title: this.title,
      turn: this.turn,

      mutations: this.mutations.map((m) => m.toData()),
      playerKeys: this.players.map((p) => p.key),
      relatesToKeys: this.relatesTo.map((o) => o.key),

      action: this.action?.toData(),
      description: this.description,
      isLocal: this.isLocal,
      typeKey: this.type?.key,
    };
  }
}

export const PohEventDataSchema = z.object({
  subjectKey: gameKeySchema(),
  title: z.string(),
  turn: z.number().int(),

  mutations: z.array(PohMutationSchema).optional(),
  playerKeys: z.array(gameKeySchema(["player"])).optional(),
  relatesToKeys: z.array(gameKeySchema()).optional(),

  action: PohActionSchema.optional(),
  description: z.string().optional(),
  isLocal: z.boolean().optional(),
  typeKey: typeKeySchema().optional(),
});

export type PohEventData = z.infer<typeof PohEventDataSchema>;
