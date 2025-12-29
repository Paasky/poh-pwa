import { TypeObject } from "@/Common/Objects/TypeObject";
import { useObjectsStore } from "@/stores/objectStore";
import { UnitDesign } from "@/Common/Models/UnitDesign";
import { Player } from "@/Common/Models/Player";
import { generateKey } from "@/Common/Models/_GameModel";

type UnitDesignPrototype = {
  player?: unknown;
  platform: { value: TypeObject | undefined };
  equipment: { value: TypeObject | undefined };
  name: { value: string };
  isElite: { value: boolean };
  pointCost: { value: number };
};

export class UnitDesignManager {
  create(prototype: UnitDesignPrototype, isFree: boolean = false): UnitDesign {
    const player = prototype.player ? (prototype.player as Player) : undefined;
    if (player && !isFree) {
      if (!player.storage.has("yieldType:designPoints", prototype.pointCost.value)) {
        throw new Error("Not enough design points to create a unit design");
      }
    }
    if (!prototype.platform || !prototype.equipment.value)
      throw new Error("platform and equipment required for new Unit Design");

    const design = new UnitDesign(
      generateKey("unitDesign"),
      prototype.platform as TypeObject,
      prototype.equipment as TypeObject,
      prototype.name.value,
      player?.key,
      prototype.isElite.value,
    );

    if (player) {
      player.designKeys.push(design.key);
      if (!isFree) {
        player.storage.take("yieldType:designPoints", prototype.pointCost.value);
      }
    }

    useObjectsStore().set(design);

    return design;
  }
}
