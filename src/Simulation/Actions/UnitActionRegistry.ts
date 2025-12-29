import { BasicUnitAction } from "@/Simulation/Actions/Unit/BasicUnitAction";
import { Unit } from "@/objects/game/Unit";
import { Attack } from "@/Simulation/Actions/Unit/Attack";
import { Bombard } from "@/Simulation/Actions/Unit/Bombard";
import { Tile } from "@/objects/game/Tile";
import { BuildImprovement } from "@/Simulation/Actions/Unit/BuildImprovement";
import { DemobilizeUnit } from "@/Simulation/Actions/Unit/DemobilizeUnit";
import { DisbandUnit } from "@/Simulation/Actions/Unit/DisbandUnit";
import { ExploreUnit } from "@/Simulation/Actions/Unit/ExploreUnit";
import { UnitMission } from "@/Simulation/Actions/Unit/UnitMission";
import { MobilizeUnit } from "@/Simulation/Actions/Unit/MobilizeUnit";
import { MoveUnit } from "@/Simulation/Actions/Unit/MoveUnit";
import { PillageTile } from "@/Simulation/Actions/Unit/PillageTile";
import { RebaseUnit } from "@/Simulation/Actions/Unit/RebaseUnit";
import { City } from "@/objects/game/City";
import { ReconTile } from "@/Simulation/Actions/Unit/ReconTile";
import { RenameUnit } from "@/Simulation/Actions/Unit/RenameUnit";
import { SettleCity } from "@/Simulation/Actions/Unit/SettleCity";
import { TradeAction } from "@/Simulation/Actions/Unit/TradeAction";
import { UpgradeUnit } from "@/Simulation/Actions/Unit/UpgradeUnit";
import { UnitDesign } from "@/objects/game/UnitDesign";
import { IActionHandler } from "@/Simulation/Actions/IActionHandler";
import { ActionType } from "@/Common/IAction";
import { Player } from "@/objects/game/Player";
import { TypeObject } from "@/types/typeObjects";
import { GameObject } from "@/objects/game/_GameObject";

export const getUnitAction = (
  actionType: ActionType,
  player: Player,
  unit: Unit,
  extras?: {
    name?: string;
    target?: GameObject;
    type?: TypeObject;
  },
): IActionHandler => {
  const city = extras?.target?.class === "city" ? (extras.target as City) : undefined;
  const tile = extras?.target?.class === "tile" ? (extras.target as Tile) : undefined;
  const targetUnit = extras?.target?.class === "unit" ? (extras.target as Unit) : undefined;
  const unitDesign =
    extras?.target?.class === "unitDesign" ? (extras.target as UnitDesign) : undefined;

  switch (actionType) {
    // Basic Unit Actions
    case "alert":
    case "fortify":
    case "heal":
    case "skip":
    case "stop":
      return new BasicUnitAction(player, unit, actionType);

    // Complex Unit Actions
    case "attack": {
      const target = targetUnit ?? city ?? tile;
      if (!target) {
        throw new Error(`No target given for attack action`);
      }
      return new Attack(player, unit, target);
    }

    case "bombard": {
      const target = targetUnit ?? city ?? tile;
      if (!target) {
        throw new Error(`No target given for attack action`);
      }
      return new Bombard(player, unit, target);
    }

    case "build": {
      if (!extras?.type) {
        throw new Error(`No type given for build action`);
      }
      return new BuildImprovement(player, unit, extras.type);
    }

    case "demobilize":
      return new DemobilizeUnit(player, unit);

    case "disband":
      return new DisbandUnit(player, unit);

    case "explore":
      return new ExploreUnit(player, unit);

    case "mission": {
      if (!extras?.type) {
        throw new Error(`No type given for mission action`);
      }
      const target = targetUnit ?? city ?? tile;
      if (!target) {
        throw new Error(`No target given for mission action`);
      }
      return new UnitMission(player, unit, extras.type, target);
    }

    case "mobilize":
      return new MobilizeUnit(player, unit);

    case "move":
      if (!tile) {
        throw new Error(`No tile given for move action`);
      }
      return new MoveUnit(player, unit, tile);

    case "pillage":
      return new PillageTile(player, unit);

    case "rebase":
      if (!tile) {
        throw new Error(`No tile given for rebase action`);
      }
      return new RebaseUnit(player, unit, tile);

    case "recon":
      if (!tile) {
        throw new Error(`No tile given for recon action`);
      }
      return new ReconTile(player, unit, tile);

    case "rename":
      if (!extras || !("name" in extras)) {
        throw new Error(`No name given for rename action`);
      }
      return new RenameUnit(player, unit, extras.name ?? "");

    case "settle":
      return new SettleCity(player, unit);

    case "trade":
      if (!city) {
        throw new Error(`No city given for trade action`);
      }
      return new TradeAction(player, unit, city);

    case "upgrade":
      if (!unitDesign) {
        throw new Error(`No unit design given for upgrade action`);
      }
      return new UpgradeUnit(player, unit, unitDesign);

    default:
      throw new Error(`Unknown unit action type: ${actionType}`);
  }
};
