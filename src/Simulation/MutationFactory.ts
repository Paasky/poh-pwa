/* eslint-disable @typescript-eslint/no-explicit-any */
import { PohMutation } from "@/Common/PohMutation";
import { City } from "@/Common/Models/City";
import { Unit } from "@/Common/Models/Unit";
import { Citizen } from "@/Common/Models/Citizen";
import { Agenda } from "@/Common/Models/Agenda";
import { Construction } from "@/Common/Models/Construction";
import { Deal } from "@/Common/Models/Deal";
import { Incident } from "@/Common/Models/Incident";
import { TradeRoute } from "@/Common/Models/TradeRoute";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { GameClass, generateKey } from "@/Common/Models/_GameTypes";
import { GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import { TypeObject } from "@/Common/Objects/TypeObject";

export function createAgenda(props: Partial<Agenda>): PohMutation {
  return create(props, "agenda", Agenda.attrsConf);
}
export function createCitizen(props: Partial<Citizen>): PohMutation {
  return create(props, "citizen", Citizen.attrsConf);
}
export function createCity(props: Partial<City>): PohMutation {
  return create(props, "city", City.attrsConf);
}
export function createConstruction(props: Partial<Construction>): PohMutation {
  return create(props, "construction", Construction.attrsConf);
}
export function createDeal(props: Partial<Deal>): PohMutation {
  return create(props, "deal", Deal.attrsConf);
}
export function createDesign(props: Partial<UnitDesign>): PohMutation {
  return create(props, "unitDesign", UnitDesign.attrsConf);
}
export function createIncident(props: Partial<Incident>): PohMutation {
  return create(props, "incident", Incident.attrsConf);
}
export function createUnit(props: Partial<Unit>): PohMutation {
  return create(props, "unit", Unit.attrsConf);
}
export function createTradeRoute(props: Partial<TradeRoute>): PohMutation {
  return create(props, "tradeRoute", TradeRoute.attrsConf);
}

function create(props: Partial<GameObject>, cls: GameClass, attrsConf: GameObjAttr[]): PohMutation {
  attrsConf.forEach((config) => {
    const attrValue = (props as any)[config.attrName];
    const hasAttr = attrValue !== undefined && attrValue !== null;

    if (!hasAttr) {
      if (!config.isOptional) {
        throw new Error(`Required property "${config.attrName}" is missing for ${cls}`);
      }
      return;
    }

    // Convert types to api format
    if (config.isTypeObj) {
      (props as any)[config.attrName + "Key"] = attrValue.key;
      delete (props as any)[config.attrName];
    }
    if (config.isTypeObjArray) {
      (props as any)[config.attrName] = attrValue.map((obj: TypeObject) => obj.key);
    }
  });

  // Make sure key is set
  if (!props.key) props.key = generateKey(cls);

  return {
    type: "create",
    payload: props,
  };
}
