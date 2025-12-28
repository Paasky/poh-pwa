import { GameKey } from "@/objects/game/_keys";
import { Player } from "@/objects/game/Player";

export const belongsToPlayer = (
  player: Player,
  object: { key: GameKey; playerKey: GameKey },
): void => {
  if (player.key !== object.playerKey)
    throw new Error(`${object.key} does not belong to ${player.name}`);
};
