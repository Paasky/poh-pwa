import { ISimAction } from "@/Simulation/Actions/ISimAction";
import { ActionType } from "@/Common/IAction";
import { Player } from "@/Common/Models/Player";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { PlayerSelectType } from "@/Simulation/Actions/Player/PlayerSelectType";
import { PlayerUnselectType } from "@/Simulation/Actions/Player/PlayerUnselectType";
import { PlayerActionCrisis } from "@/Simulation/Actions/Player/PlayerActionCrisis";

export const PlayerActionKeys = new Set<ActionType>([
  "actionType:selectHeritage",
  "actionType:selectTrait",
  "actionType:selectMyth",
  "actionType:selectGod",
  "actionType:selectDogma",
  "actionType:selectPolicy",
  "actionType:selectTechnology",
  "actionType:unselectTrait",
  "actionType:enactReforms",
  "actionType:joinRevolution",
  "actionType:keepStatusQuo",
]);

export const getPlayerAction = (
  actionType: ActionType,
  player: Player,
  extras?: {
    type?: TypeObject;
  },
): ISimAction => {
  switch (actionType) {
    case "actionType:selectHeritage":
    case "actionType:selectTrait":
    case "actionType:selectMyth":
    case "actionType:selectGod":
    case "actionType:selectDogma":
    case "actionType:selectPolicy":
    case "actionType:selectTechnology":
      if (!extras?.type) throw new Error(`No type given for select action`);
      return new PlayerSelectType(player, extras.type);

    case "actionType:unselectTrait":
      if (!extras?.type) throw new Error(`No type given for unselect action`);
      return new PlayerUnselectType(player, extras.type);

    case "actionType:enactReforms":
    case "actionType:joinRevolution":
    case "actionType:keepStatusQuo":
      return new PlayerActionCrisis(player, actionType);

    default:
      throw new Error(`Unknown player action type: ${actionType}`);
  }
};
