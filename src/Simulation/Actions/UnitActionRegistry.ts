import { BasicUnitAction } from "@/Simulation/Actions/Unit/BasicUnitAction";
import { Unit } from "@/Common/Models/Unit";
import { UnitAttack } from "@/Simulation/Actions/Unit/UnitAttack";
import { UnitBombard } from "@/Simulation/Actions/Unit/UnitBombard";
import { Tile } from "@/Common/Models/Tile";
import { UnitBuild } from "@/Simulation/Actions/Unit/UnitBuild";
import { UnitDemobilize } from "@/Simulation/Actions/Unit/UnitDemobilize";
import { UnitDisband } from "@/Simulation/Actions/Unit/UnitDisband";
import { UnitExplore } from "@/Simulation/Actions/Unit/UnitExplore";
import { UnitMission } from "@/Simulation/Actions/Unit/UnitMission";
import { UnitMobilize } from "@/Simulation/Actions/Unit/UnitMobilize";
import { UnitMove } from "@/Simulation/Actions/Unit/UnitMove";
import { UnitPillage } from "@/Simulation/Actions/Unit/UnitPillage";
import { UnitRebase } from "@/Simulation/Actions/Unit/UnitRebase";
import { City } from "@/Common/Models/City";
import { UnitRecon } from "@/Simulation/Actions/Unit/UnitRecon";
import { UnitRename } from "@/Simulation/Actions/Unit/UnitRename";
import { UnitSettle } from "@/Simulation/Actions/Unit/UnitSettle";
import { UnitTrade } from "@/Simulation/Actions/Unit/UnitTrade";
import { UnitUpgrade } from "@/Simulation/Actions/Unit/UnitUpgrade";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { IAction } from "@/Simulation/Actions/IAction";
import { ActionType } from "@/Common/IAction";
import { Player } from "@/Common/Models/Player";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { GameObject } from "@/Common/Models/_GameModel";

export const getUnitAction = (
  actionType: ActionType,
  player: Player,
  unit: Unit,
  extras?: {
    name?: string;
    target?: GameObject;
    type?: TypeObject;
  },
): IAction => {
  const city = extras?.target?.class === "city" ? (extras.target as City) : undefined;
  const tile = extras?.target?.class === "tile" ? (extras.target as Tile) : undefined;
  const targetUnit = extras?.target?.class === "unit" ? (extras.target as Unit) : undefined;
  const unitDesign =
    extras?.target?.class === "unitDesign" ? (extras.target as UnitDesign) : undefined;

  switch (actionType) {
    // Basic Unit Actions
    case "actionType:alert":
    case "actionType:fortify":
    case "actionType:heal":
    case "actionType:skipTurn":
    case "actionType:stop":
      return new BasicUnitAction(player, unit, actionType);

    // Complex Unit Actions
    case "actionType:attack": {
      const target =
        // If a target unit was given, use it
        targetUnit ??
        // If a city was given, use it
        city ??
        // If a tile was given, get a target from it
        (tile ? UnitAttack.getTileTarget(unit, tile) : undefined);

      if (!target) {
        throw new Error(`No target given for attack action`);
      }

      return new UnitAttack(player, unit, target);
    }

    case "actionType:bombard": {
      const target = targetUnit ?? city ?? tile;
      if (!target) {
        throw new Error(`No target given for attack action`);
      }
      return new UnitBombard(player, unit, target);
    }

    case "actionType:build": {
      if (!extras?.type) {
        throw new Error(`No type given for build action`);
      }
      return new UnitBuild(player, unit, extras.type);
    }

    case "actionType:demobilize":
      return new UnitDemobilize(player, unit);

    case "actionType:disband":
      return new UnitDisband(player, unit);

    case "actionType:explore":
      return new UnitExplore(player, unit);

    case "actionType:mission": {
      if (!extras?.type) {
        throw new Error(`No type given for mission action`);
      }
      const target = targetUnit ?? city ?? tile;
      if (!target) {
        throw new Error(`No target given for mission action`);
      }
      return new UnitMission(player, unit, extras.type, target);
    }

    case "actionType:mobilize":
      return new UnitMobilize(player, unit);

    case "actionType:move":
      if (!tile) {
        throw new Error(`No tile given for move action`);
      }
      return new UnitMove(player, unit, tile);

    case "actionType:pillage":
      return new UnitPillage(player, unit);

    case "actionType:rebase":
      if (!tile) {
        throw new Error(`No tile given for rebase action`);
      }
      return new UnitRebase(player, unit, tile);

    case "actionType:recon":
      if (!tile) {
        throw new Error(`No tile given for recon action`);
      }
      return new UnitRecon(player, unit, tile);

    case "actionType:rename":
      if (!extras || !("name" in extras)) {
        throw new Error(`No name given for rename action`);
      }
      return new UnitRename(player, unit, extras.name ?? "");

    case "actionType:settle":
      return new UnitSettle(player, unit);

    case "actionType:trade":
      if (!city) {
        throw new Error(`No city given for trade action`);
      }
      return new UnitTrade(player, unit, city);

    case "actionType:upgrade":
      if (!unitDesign) {
        throw new Error(`No unit design given for upgrade action`);
      }
      return new UnitUpgrade(player, unit, unitDesign);

    default:
      throw new Error(`Unknown unit action type: ${actionType}`);
  }
};
