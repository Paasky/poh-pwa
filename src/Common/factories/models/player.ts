import { generateKey, type GameKey } from "@/Common/Models/_GameModel";
import { Player } from "@/Common/Models/Player";
import { Culture } from "@/Common/Models/Culture";
import { Diplomacy } from "@/Common/Objects/Diplomacy";
import { Government } from "@/Common/Models/Government";
import { Research } from "@/Common/Models/Research";
import type { TypeObject } from "@/Common/Static/Objects/TypeObject";
export type PlayerCluster = {
  player: Player;
  culture: Culture;
  diplomacy: Diplomacy;
  government: Government;
  research: Research;
  all: (Player | Culture | Diplomacy | Government | Research)[];
};

export type CreatePlayerOptions = {
  cultureType: TypeObject;
  key?: GameKey;
  userName?: string;
  isHuman?: boolean;
  isMinor?: boolean;
};

export function createPlayer(options: CreatePlayerOptions): PlayerCluster {
  const { cultureType, userName, isHuman = false, isMinor = false } = options;

  const playerKey = options.key ?? generateKey("player");
  const cultureKey = generateKey("culture");
  const diplomacyKey = generateKey("diplomacy");
  const governmentKey = generateKey("government");
  const researchKey = generateKey("research");

  const player = new Player(
    playerKey,
    cultureKey,
    diplomacyKey,
    governmentKey,
    researchKey,
    userName,
    isHuman,
    false,
    isMinor,
  );

  const culture = new Culture(cultureKey, cultureType, playerKey);
  const diplomacy = new Diplomacy(diplomacyKey, playerKey);
  const government = new Government(governmentKey, playerKey);
  const research = new Research(researchKey, playerKey);

  return {
    player,
    culture,
    diplomacy,
    government,
    research,
    all: [player, culture, diplomacy, government, research],
  };
}
