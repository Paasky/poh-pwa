import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { ActionType } from "@/Common/IAction";
import { Player } from "@/Common/Models/Player";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { City } from "@/Common/Models/City";
import { Construction } from "@/Common/Models/Construction";
import { Unit } from "@/Common/Models/Unit";
import { Tile } from "@/Common/Models/Tile";
import { CityBombard } from "@/Simulation/ActorActions/City/CityBombard";
import { CityStartConstruction } from "@/Simulation/ActorActions/City/CityStartConstruction";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { CityStartTraining } from "@/Simulation/ActorActions/City/CityStartTraining";
import { CityExpand } from "@/Simulation/ActorActions/City/CityExpand";
import { CityRename } from "@/Simulation/ActorActions/City/CityRename";
import { Citizen } from "@/Common/Models/Citizen";
import { CitizenPickTile } from "@/Simulation/ActorActions/City/CitizenPickTile";
import { CityLevy } from "@/Simulation/ActorActions/City/CityLevy";
import { CityHurryQueue } from "@/Simulation/ActorActions/City/CityHurryQueue";
import { CityOrderQueue } from "@/Simulation/ActorActions/City/CityOrderQueue";
import { CityCancelQueue } from "@/Simulation/ActorActions/City/CityCancelQueue";

export const CityActionKeys = new Set<ActionType>([
  "actionType:cityBombard",
  "actionType:startConstruction",
  "actionType:orderConstruction",
  "actionType:hurryConstruction",
  "actionType:cancelConstruction",
  "actionType:startTraining",
  "actionType:orderTraining",
  "actionType:hurryTraining",
  "actionType:cancelTraining",
  "actionType:moveCitizen",
  "actionType:purchaseTile",
  "actionType:renameCity",
  "actionType:levyUnit",
]);

export const getCityAction = (
  actionType: ActionType,
  player: Player,
  city: City,
  extras?: {
    citizen?: Citizen;
    design?: UnitDesign;
    index?: number;
    toIndex?: number;
    name?: string;
    target?: City | Construction | Tile | Unit;
    tile?: Tile;
    type?: TypeObject;
  },
): ISimAction => {
  switch (actionType) {
    case "actionType:cityBombard": {
      if (!extras?.target) throw new Error("No target given for city bombard action");

      const actualTarget =
        extras.target instanceof Tile
          ? CityBombard.getTileTarget(city, extras.target)
          : extras.target;

      if (!actualTarget) throw new Error("No valid target for city bombard action");

      return new CityBombard(player, city, actualTarget);
    }

    case "actionType:startConstruction":
      if (!extras?.type) throw new Error("No type given for start construction action");
      if (!extras?.tile) throw new Error("No tile given for start construction action");
      return new CityStartConstruction(player, city, extras.type, extras.tile, extras.index ?? 0);

    case "actionType:orderConstruction":
      if (typeof extras?.index !== "number")
        throw new Error("Invalid index for order construction action");
      if (typeof extras?.toIndex !== "number")
        throw new Error("Invalid toIndex for order construction action");
      return new CityOrderQueue(player, city, city.constructionQueue, extras.index, extras.toIndex);

    case "actionType:hurryConstruction":
      return new CityHurryQueue(player, city, city.constructionQueue);

    case "actionType:cancelConstruction":
      if (typeof extras?.index !== "number")
        throw new Error("Invalid index for order construction action");
      return new CityCancelQueue(player, city, city.constructionQueue, extras.index);

    case "actionType:startTraining":
      if (!extras?.design) throw new Error("No design given for start training action");
      return new CityStartTraining(player, city, extras.design, extras.index ?? 0);

    case "actionType:orderTraining":
      if (typeof extras?.index !== "number")
        throw new Error("Invalid index for order training action");
      if (typeof extras?.toIndex !== "number")
        throw new Error("Invalid toIndex for order training action");
      return new CityOrderQueue(player, city, city.trainingQueue, extras.index, extras.toIndex);

    case "actionType:hurryTraining":
      return new CityHurryQueue(player, city, city.trainingQueue);

    case "actionType:cancelTraining":
      if (typeof extras?.index !== "number")
        throw new Error("Invalid index for order training action");
      return new CityCancelQueue(player, city, city.trainingQueue, extras.index);

    case "actionType:moveCitizen":
      if (!extras?.citizen) throw new Error("No citizen given for move citizen action");
      if (!extras?.tile) throw new Error("No tile given for move citizen action");
      return new CitizenPickTile(player, extras.citizen, extras.tile);

    case "actionType:purchaseTile":
      if (!extras?.tile) throw new Error("No tile given for purchase tile action");
      return new CityExpand(player, city, extras.tile, true);

    case "actionType:renameCity":
      if (!extras?.name) throw new Error("No name given for rename city action");
      return new CityRename(player, city, extras.name);

    case "actionType:levyUnit":
      if (!extras?.citizen) throw new Error("No citizen given for levy unit action");
      return new CityLevy(player, city, extras.citizen);

    default:
      throw new Error(`Unknown player action type: ${actionType}`);
  }
};
