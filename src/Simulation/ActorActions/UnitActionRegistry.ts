import { UnitBasicAction } from "@/Simulation/ActorActions/Unit/UnitBasicAction";
import { Unit } from "@/Common/Models/Unit";
import { UnitAttack } from "@/Simulation/ActorActions/Unit/UnitAttack";
import { UnitBombard } from "@/Simulation/ActorActions/Unit/UnitBombard";
import { Tile } from "@/Common/Models/Tile";
import { UnitBuild } from "@/Simulation/ActorActions/Unit/UnitBuild";
import { UnitDemobilize } from "@/Simulation/ActorActions/Unit/UnitDemobilize";
import { UnitDisband } from "@/Simulation/ActorActions/Unit/UnitDisband";
import { UnitExplore } from "@/Simulation/ActorActions/Unit/UnitExplore";
import { UnitMission } from "@/Simulation/ActorActions/Unit/UnitMission";
import { UnitMobilize } from "@/Simulation/ActorActions/Unit/UnitMobilize";
import { UnitMove } from "@/Simulation/ActorActions/Unit/UnitMove";
import { UnitPillage } from "@/Simulation/ActorActions/Unit/UnitPillage";
import { UnitRebase } from "@/Simulation/ActorActions/Unit/UnitRebase";
import { City } from "@/Common/Models/City";
import { UnitRecon } from "@/Simulation/ActorActions/Unit/UnitRecon";
import { UnitRename } from "@/Simulation/ActorActions/Unit/UnitRename";
import { UnitSettle } from "@/Simulation/ActorActions/Unit/UnitSettle";
import { UnitTrade } from "@/Simulation/ActorActions/Unit/UnitTrade";
import { UnitUpgrade } from "@/Simulation/ActorActions/Unit/UnitUpgrade";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { ISimAction } from "@/Simulation/ActorActions/ISimAction";
import { ActionType } from "@/Common/PohAction";
import { Player } from "@/Common/Models/Player";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { Construction } from "@/Common/Models/Construction";

export const UnitActionKeys = new Set<ActionType>([
  "actionType:alert",
  "actionType:fortify",
  "actionType:heal",
  "actionType:skipTurn",
  "actionType:stop",
  "actionType:attack",
  "actionType:bombard",
  "actionType:build",
  "actionType:demobilize",
  "actionType:disband",
  "actionType:explore",
  "actionType:mission",
  "actionType:mobilize",
  "actionType:move",
  "actionType:pillage",
  "actionType:rebase",
  "actionType:recon",
  "actionType:rename",
  "actionType:settle",
  "actionType:trade",
  "actionType:upgrade",
]);

export const getUnitAction = (
  actionType: ActionType,
  player: Player,
  unit: Unit,
  extras?: {
    design?: UnitDesign;
    name?: string;
    target?: City | Construction | Tile | Unit;
    type?: TypeObject;
  },
): ISimAction => {
  const city = extras?.target?.class === "city" ? (extras.target as City) : undefined;
  const tile = extras?.target?.class === "tile" ? (extras.target as Tile) : undefined;
  const targetUnit = extras?.target?.class === "unit" ? (extras.target as Unit) : undefined;
  const unitDesign = extras?.target?.class === "unitDesign" ? extras.design : undefined;

  switch (actionType) {
    // Basic Unit Actions
    case "actionType:alert":
    case "actionType:fortify":
    case "actionType:heal":
    case "actionType:skipTurn":
    case "actionType:stop":
      return new UnitBasicAction(player, unit, actionType);

    // Complex Unit Actions
    case "actionType:attack": {
      if (!extras?.target) throw new Error(`No target given for attack action`);

      const actualTarget =
        extras.target instanceof Tile
          ? UnitAttack.getTileTarget(unit, extras.target)
          : extras.target;

      if (!actualTarget) throw new Error(`No valid target for attack action`);

      return new UnitAttack(player, unit, actualTarget);
    }

    case "actionType:bombard": {
      if (!extras?.target) throw new Error(`No target given for bombard action`);

      const actualTarget =
        extras.target instanceof Tile
          ? UnitBombard.getTileTarget(unit, extras.target)
          : extras.target;

      if (!actualTarget) throw new Error(`No valid target for bombard action`);

      return new UnitBombard(player, unit, actualTarget);
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
