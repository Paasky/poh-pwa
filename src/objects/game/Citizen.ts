/* eslint-disable @typescript-eslint/no-explicit-any */
import { canHaveOne, hasOne } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { computed, ComputedRef, Ref, ref } from "vue";
import { Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import type { City } from "@/objects/game/City";
import type { Player } from "@/objects/game/Player";
import type { Culture } from "@/objects/game/Culture";
import type { Religion } from "@/objects/game/Religion";
import type { Tile } from "@/objects/game/Tile";
import { getRandom } from "@/helpers/arrayTools";
import { useEventStore } from "@/stores/eventStore";
import { CitizenGained, CitizenLost } from "@/events/Citizen";
import { useObjectsStore } from "@/stores/objectStore";

export class Citizen extends GameObject {
  constructor(
    key: GameKey,
    cityKey: GameKey,
    cultureKey: GameKey,
    playerKey: GameKey,
    tileKey: GameKey,
    religionKey: GameKey | null = null,
    policy: TypeObject | null = null,
  ) {
    super(key);

    if (policy) this.policy.value = policy;

    this.cityKey = cityKey;

    this.city = hasOne<City>(this.cityKey, `${this.key}.city`);
    this.cultureKey = ref(cultureKey);

    this.culture = hasOne<Culture>(this.cultureKey, `${this.key}.culture`);

    this.playerKey = ref(playerKey);
    this.player = hasOne<Player>(this.playerKey, `${this.key}.player`);

    if (religionKey) this.religionKey.value = religionKey;

    this.tileKey = ref(tileKey);
    this.tile = hasOne<Tile>(this.tileKey, `${this.key}.tile`);
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "cityKey", attrNotRef: true, related: { theirKeyAttr: "citizenKeys" } },
    { attrName: "cultureKey", related: { theirKeyAttr: "citizenKeys" } },
    { attrName: "playerKey", related: { theirKeyAttr: "citizenKeys" } },
    { attrName: "tileKey", related: { theirKeyAttr: "citizenKeys" } },
    {
      attrName: "religionKey",
      isOptional: true,
      related: { theirKeyAttr: "citizenKeys" },
    },
    { attrName: "policy", isOptional: true, isTypeObj: true },
  ];

  /*
   * Attributes
   */
  policy = ref<TypeObject | null>(null);

  /*
   * Relations
   */
  cityKey: GameKey;
  city: ComputedRef<City>;

  cultureKey: Ref<GameKey>;
  culture: ComputedRef<Culture>;

  playerKey: Ref<GameKey>;
  player: ComputedRef<Player>;

  religionKey = ref<GameKey | null>(null);
  religion = canHaveOne<Religion>(this.religionKey, `${this.key}.religion`);

  tileKey: Ref<GameKey>;
  tile: ComputedRef<Tile>;

  /*
   * Computed
   */
  tileYields = computed(() =>
    this.tile.value.yields.value.only(this.concept.inheritYieldTypes!, [this.concept]),
  );

  work = computed(() => this.tile.value.construction.value);

  workYields = computed(
    (): Yields | null =>
      this.work.value?.yields.value.only(this.concept.inheritYieldTypes!, [this.concept]) ?? null,
  );

  yields = computed(
    () => new Yields([...this.tileYields.value.all(), ...(this.workYields.value?.all() ?? [])]),
  );

  /*
   * Actions
   */
  complete() {
    this.city.value.citizenKeys.value.push(this.key);

    this.pickTile();

    // Use any as IDE has a Ref value mismatch
    useEventStore().turnEvents.push(new CitizenGained(this, "growth") as any);
  }

  delete(reason: string) {
    this.city.value.citizenKeys.value = this.city.value.citizenKeys.value.filter(
      (k) => k !== this.key,
    );
    this.culture.value.citizenKeys.value = this.culture.value.citizenKeys.value.filter(
      (k) => k !== this.key,
    );
    this.player.value.citizenKeys.value = this.player.value.citizenKeys.value.filter(
      (k) => k !== this.key,
    );
    if (this.religion.value) {
      this.religion.value.citizenKeys.value = this.religion.value.citizenKeys.value.filter(
        (k) => k !== this.key,
      );
    }
    this.tile.value.citizenKeys.value = this.tile.value.citizenKeys.value.filter(
      (k) => k !== this.key,
    );

    delete useObjectsStore()._gameObjects[this.key];

    useEventStore().turnEvents.push(
      // Use any as IDE has a Ref value mismatch
      new CitizenLost(this.city.value, this.tile.value, reason) as any,
    );
  }

  migrate(toCity: City) {
    const fromCity = this.city.value;

    fromCity.citizenKeys.value = fromCity.citizenKeys.value.filter((k) => k !== this.key);
    this.player.value.citizenKeys.value = this.player.value.citizenKeys.value.filter(
      (k) => k !== this.key,
    );

    useEventStore().turnEvents.push(
      new CitizenLost(
        fromCity,
        this.tile.value,
        `migration to ${toCity.name} (${toCity.player.value.name})`,
        this,
        // Use any as IDE has a Ref value mismatch
      ) as any,
    );

    this.cityKey = toCity.key;
    toCity.citizenKeys.value.push(this.key);
    this.pickTile();

    useEventStore().turnEvents.push(
      new CitizenGained(
        this,
        `immigrated from ${fromCity.name} (${fromCity.player.value.name})`,
        // Use any as IDE has a Ref value mismatch
      ) as any,
    );
  }

  pickTile() {
    if (this.tileKey) {
      this.tile.value.citizenKeys.value = this.tile.value.citizenKeys.value.filter(
        (k) => k !== this.key,
      );
    }

    // todo pick tile per city preferences
    this.tileKey.value = getRandom(
      this.city.value.tile.value.getNeighbors(3).filter((n) => n.playerKey === this.playerKey),
    ).key;

    this.tile.value.citizenKeys.value.push(this.key);
  }
}
