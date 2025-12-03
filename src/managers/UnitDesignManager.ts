import { TypeObject } from "@/types/typeObjects";
import { useObjectsStore } from "@/stores/objectStore";
import { UnitDesignPrototype } from "@/components/LegacyPlayerDetails/UnitsTab/UnitDesignPrototype";
import { UnitDesign } from "@/objects/game/UnitDesign";
import { Player } from "@/objects/game/Player";
import { generateKey } from "@/objects/game/_GameObject";

export class UnitDesignManager {
  create(prototype: UnitDesignPrototype, isFree: boolean = false): UnitDesign {
    const player = prototype.player ? (prototype.player as Player) : undefined;
    if (player && !isFree) {
      if (!player.storage.has("yieldType:designPoints", prototype.pointCost.value)) {
        throw new Error("Not enough design points to create a unit design");
      }
    }
    if (!prototype.platform.value || !prototype.equipment.value)
      throw new Error("platform and equipment required for new Unit Design");

    const design = new UnitDesign(
      generateKey("unitDesign"),
      prototype.platform.value as TypeObject,
      prototype.equipment.value as TypeObject,
      prototype.name.value,
      player?.key,
      prototype.isElite.value,
    );

    if (player) {
      player.designKeys.value.push(design.key);
      if (!isFree) {
        player.storage.take("yieldType:designPoints", prototype.pointCost.value);
      }
    }

    useObjectsStore().set(design);

    return design;
  }
}
