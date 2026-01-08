import { City } from "@/Common/Models/City";
import { Construction } from "@/Common/Models/Construction";
import { Unit } from "@/Common/Models/Unit";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { Tile } from "@/Common/Models/Tile";
import { IMutation } from "@/Common/IMutation";
import { createConstruction } from "@/Simulation/MutationFactory";
import { clamp } from "@/helpers/basicMath";
import { useDataBucket } from "@/Data/useDataBucket";

export class Construct {
  constructor(public readonly object: City | Unit) {}

  complete(construction: Construction): IMutation {
    return {
      type: "update",
      payload: {
        key: construction.key,
        progress: construction.type.yields.getLumpAmount("yieldType:productionCost"),
        completedAtTurn: useDataBucket().world.turn,
      },
    };
  }

  progress(construction: Construction, amount: number): IMutation {
    const progress = clamp(
      construction.progress + amount,
      0,
      construction.type.yields.getLumpAmount("yieldType:productionCost"),
    );

    return {
      type: "update",
      payload: {
        key: construction.key,
        progress,
      },
    };
  }

  start(type: TypeObject, tile: Tile): IMutation {
    const props = {
      type,
      tileKey: tile.key,
    } as Partial<Construction>;

    if (tile.city) props.cityKey = tile.city.key;

    return createConstruction(props);
  }
}
