import { Player } from "@/objects/game/Player";
import { computed, ref, watch } from "vue";
import { TypeObject } from "@/types/typeObjects";
import { UnitDesign } from "@/objects/game/UnitDesign";
import { useObjectsStore } from "@/stores/objectStore";

export class UnitDesignPrototype {
  player: Player | null;

  platform = ref<TypeObject | null>(null);
  knownPlatforms = computed(
    (): TypeObject[] =>
      this.player?.knownTypes.value.filter((t) => t.class === "platformType") ?? [],
  );
  availablePlatforms = computed((): TypeObject[] =>
    this.knownPlatforms.value.filter((p) =>
      this.knownEquipments.value.find((e) => p.key in e.names!),
    ),
  );

  equipment = ref<TypeObject | null>(null);
  knownEquipments = computed(
    (): TypeObject[] =>
      this.player?.knownTypes.value.filter((t) => t.class === "equipmentType") ?? [],
  );
  availableEquipments = computed((): TypeObject[] => {
    if (!this.platform.value) return [];
    return this.knownEquipments.value.filter((e) => this.platform.value!.key in e.names!);
  });

  isElite = ref(false);

  name = ref("");

  upgradeFrom = ref<UnitDesign | null>(null);
  upgradeFromDesigns = computed((): UnitDesign[] => {
    if (!this.player || !this.platform.value || !this.equipment.value) return [];

    const tree: TypeObject[] = [];
    upgradeTree(this.equipment.value as TypeObject, tree);
    upgradeTree(this.platform.value as TypeObject, tree);

    return this.player.designs.value.filter(
      (d) => tree.includes(d.equipment) || tree.includes(d.platform),
    );
  });

  pointCost = computed(() => 2 + (this.isElite.value ? 2 : 0) - (this.upgradeFrom.value ? 1 : 0));

  constructor(
    player: Player | null = null,
    platform: TypeObject | null = null,
    equipment: TypeObject | null = null,
  ) {
    this.player = player;
    this.platform.value = platform;
    this.equipment.value = equipment;

    watch(
      () => this.availablePlatforms.value.map((e) => e.key).join(","),
      () => {
        if (this.availablePlatforms.value.length === 1) {
          this.platform.value = this.availablePlatforms.value[0];
          return;
        }
        if (
          this.platform.value &&
          !this.availablePlatforms.value.includes(this.platform.value as TypeObject)
        ) {
          this.platform.value = null;
        }
      },
    );

    watch(
      () => this.availableEquipments.value.map((e) => e.key).join(","),
      () => {
        if (this.availableEquipments.value.length === 1) {
          this.equipment.value = this.availableEquipments.value[0];
          return;
        }
        if (
          this.equipment.value &&
          !this.availableEquipments.value.includes(this.equipment.value as TypeObject)
        ) {
          this.equipment.value = null;
        }
      },
    );

    watch([this.platform, this.equipment], () => {
      if (!this.platform.value || !this.equipment.value) {
        this.name.value = "";
        return;
      }

      this.name.value = this.equipment.value.names![this.platform.value.key] ?? "";
    });

    watch(
      () => this.upgradeFromDesigns.value.map((e) => e.key).join(","),
      () => {
        if (
          this.upgradeFrom.value &&
          !this.upgradeFromDesigns.value.includes(this.upgradeFrom.value as unknown as UnitDesign)
        ) {
          this.upgradeFrom.value = null;
        }
      },
    );
  }
}

export function upgradeTree(type: TypeObject, tree: TypeObject[]): void {
  for (const key of type.upgradesFrom) {
    const from = useObjectsStore().getTypeObject(key);
    if (tree.includes(from)) continue;

    tree.push(from);
    upgradeTree(from, tree);
  }
}
