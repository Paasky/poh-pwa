import z from "zod";
import { GameKey, GameObject, IRawGameObject } from "@/Common/Models/_GameModel";
import { IMutation } from "@/Common/IMutation";
import { IAction } from "@/Common/IAction";
import { TypeObject } from "@/Common/Static/Objects/TypeObject";
import { useDataBucket } from "@/Data/useDataBucket";
import { Player } from "@/Common/Models/Player";
import { gameKeySchema, typeKeySchema } from "@/Common/Validation";

export interface IEvent {
  playerKeys: Set<GameKey>;
  mutations: IMutation<Partial<GameObject>>[];
  object?: IRawGameObject;
}

export class PohEvent {
  readonly turn: number;
  readonly title: string;
  readonly subject: GameObject;
  readonly description?: string;
  readonly type?: TypeObject;
  readonly players: Player[];
  readonly action?: IAction;
  readonly mutations: IMutation<GameObject>[];
  readonly isLocal: boolean;

  // For UI
  isRead?: boolean;

  constructor(
    turn: number,
    title: string,
    subject: GameObject, // What is this event about?
    opts: {
      description?: string;
      type?: TypeObject;
      players?: Player[]; // Who knows about the event? (empty = everyone)
      action?: IAction; // What Action caused the event?
      mutations?: IMutation<GameObject>[]; // What mutations happened with the event?
      isLocal?: boolean; // Event came from local or from a host (host event mutations must be applied to local store)
    },
  ) {
    this.turn = turn;
    this.title = title;
    this.subject = subject;
    this.description = opts.description;
    this.type = opts.type;
    this.players = opts.players ?? [];
    this.action = opts.action;
    this.mutations = opts.mutations ?? [];
    this.isLocal = opts.isLocal ?? false;
  }

  static fromData(data: PohEventData): PohEvent {
    const bucket = useDataBucket();

    return new PohEvent(data.turn, data.title, bucket.getObject(data.subjectKey), {
      description: data.description,
      type: data.typeKey ? bucket.getType(data.typeKey) : undefined,
      players: data.playerKeys.map((key) => bucket.getObject<Player>(key)),
      action: data.action,
      mutations: data.mutations,
    });
  }

  toData(): PohEventData {
    return {
      turn: this.turn,
      title: this.title,
      description: this.description,
      typeKey: this.type?.key,
      subjectKey: this.subject.key,
      playerKeys: this.players.map((p) => p.key),
      action: this.action,
      mutations: this.mutations,
    };
  }
}

export const PohEventDataSchema = z.object({
  playerKeys: z.array(gameKeySchema(["player"])),
  subjectKey: gameKeySchema(),
  title: z.string(),
  turn: z.number().int(),
  action: IActionSchema.optional(),
  description: z.string().optional(),
  mutations: z.array(IMutationSchema),
  typeKey: typeKeySchema().optional(),
});

export type PohEventData = z.infer<typeof PohEventDataSchema>;
