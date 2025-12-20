import { hasMany, hasOne } from "@/objects/game/_relations";
import { computed, ComputedRef, Ref, ref } from "vue";
import { ConstructionQueue, TrainingQueue } from "@/objects/Queues";
import { TypeStorage } from "@/objects/storage";
import { Yield, Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject, generateKey } from "@/objects/game/_GameObject";
import { Citizen } from "@/objects/game/Citizen";
import type { Player } from "@/objects/game/Player";
import type { Religion } from "@/objects/game/Religion";
import type { Tile } from "@/objects/game/Tile";
import type { TradeRoute } from "@/objects/game/TradeRoute";
import { Unit } from "@/objects/game/Unit";
import { useObjectsStore } from "@/stores/objectStore";
import { Construction } from "@/objects/game/Construction";
import { useEventStore } from "@/stores/eventStore";
import { getRandom } from "@/helpers/arrayTools";
import { TypeObject } from "@/types/typeObjects";

export class City extends GameObject {
  constructor(
    key: GameKey,
    playerKey: GameKey,
    tileKey: GameKey,
    name: string,
    canAttack = false,
    health = 100,
    isCapital = false,
    origPlayerKey?: GameKey,
  ) {
    super(key);

    this.canAttack.value = canAttack;
    this.health.value = health;
    this.isCapital.value = isCapital;
    this.name.value = name;

    // noinspection DuplicatedCode
    this.origPlayerKey = origPlayerKey ?? playerKey;
    this.origPlayer = hasOne<Player>(this.origPlayerKey, `${this.key}.origPlayer`);

    this.playerKey = ref(playerKey);
    this.player = hasOne<Player>(this.playerKey, `${this.key}.player`);

    this.tileKey = tileKey;
    this.tile = hasOne<Tile>(this.tileKey, `${this.key}.tile`);
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "playerKey", related: { theirKeyAttr: "cityKeys" } },
    { attrName: "tileKey", attrNotRef: true, related: { theirKeyAttr: "cityKey", isOne: true } },
    { attrName: "name" },
    { attrName: "canAttack", isOptional: true },
    { attrName: "health", isOptional: true },
    { attrName: "isCapital", isOptional: true },
    { attrName: "origPlayerKey", isOptional: true, attrNotRef: true },
  ];

  /*
   * Attributes
   */
  canAttack = ref(false);
  constructionQueue = new ConstructionQueue();
  health = ref(100);
  isCapital = ref(false);
  name = ref("");
  storage = new TypeStorage();
  trainingQueue = new TrainingQueue();

  /*
   * Relations
   */
  citizenKeys = ref([] as GameKey[]);
  citizens = hasMany<Citizen>(this.citizenKeys, `${this.key}.citizens`);

  constructionKeys = ref([] as GameKey[]);
  constructions = hasMany<Construction>(this.constructionKeys, `${this.key}.constructions`);

  holyCityForKeys = ref([] as GameKey[]);
  holyCityFor = hasMany<Religion>(this.holyCityForKeys, `${this.key}.holyCityFor`);

  origPlayerKey: GameKey;
  origPlayer: ComputedRef<Player>;

  playerKey: Ref<GameKey>;
  player: ComputedRef<Player>;

  tileKey: GameKey;
  tile: ComputedRef<Tile>;

  tradeRouteKeys = ref([] as GameKey[]);
  tradeRoutes = hasMany<TradeRoute>(this.tradeRouteKeys, `${this.key}.tradeRoutes`);

  unitKeys = ref([] as GameKey[]);
  units = hasMany<Unit>(this.unitKeys, `${this.key}.units`);

  /*
   * Computed
   */
  citizenYields = computed((): Yields => {
    const inherit = this.concept.inheritYieldTypes!;
    return new Yields(this.citizens.value.flatMap((c) => c.yields.value.only(inherit).all()));
  });

  constructableTypes = computed(() => useObjectsStore().getClassTypes("buildingType"));

  ownedTypes = computed(() => {
    const types = new Set<TypeObject>();
    for (const citizen of this.citizens.value) {
      if (citizen.tile.value.naturalWonder) {
        types.add(citizen.tile.value.naturalWonder);
      }
      if (citizen.work.value?.isActive.value) {
        if (
          citizen.work.value.type.class === "buildingType" ||
          citizen.work.value.type.class === "nationalWonderType" ||
          citizen.work.value.type.class === "worldWonderType"
        ) {
          types.add(citizen.work.value.type);
        }
      }
    }
    return Array.from(types);
  });

  tileYields = computed(() =>
    this.tile.value.yields.value.only(this.concept.inheritYieldTypes!, [this.concept]),
  );
  trainableDesigns = computed(() => this.player.value.designs.value);

  yields = computed(
    (): Yields =>
      new Yields([...this.tileYields.value.all(), ...this.citizenYields.value.all()]).applyMods(),
  );

  // Total population derived from citizen count
  pop = computed(() => 25 + Math.round(Math.pow(this.citizens.value.length, 3.5)));

  foodToGrow = computed(() => Math.round((this.citizenKeys.value.length * 7) ** 1.2));

  /*
   * Actions
   */
  startTurn(): void {
    // Load the yields from the end of the prev turn into storage
    this.storage.load(this.yields.value.toStorage().all());

    // If the city has enough food to grow, add a new Citizen
    if (this.storage.amount("yieldType:food") >= this.foodToGrow.value) {
      const policies = this.player.value.knownTypes.value.filter((t) => t.class === "policyType");
      useEventStore().readyCitizens.push(
        new Citizen(
          generateKey("citizen"),
          this.key,
          this.player.value.cultureKey,
          this.playerKey.value,
          this.tileKey,
          this.player.value.religionKey.value,
          getRandom(policies.length ? policies : [null]),
          // eslint-disable-next-line
        ) as any,
      );
      this.storage.take("yieldType:food", this.foodToGrow.value);
    }

    const halfProd = {
      type: "yieldType:production",
      amount: this.storage.takeAll("yieldType:production") / 2,
      method: "lump",
      for: [],
      vs: [],
    } as Yield;

    const constructed = this.constructionQueue.startTurn(halfProd, this.storage, this.yields.value);
    const trained = this.trainingQueue.startTurn(halfProd, this.storage, this.yields.value);

    if (constructed) {
      // eslint-disable-next-line
      useEventStore().readyConstructions.push(constructed as any);
    }
    if (trained) {
      useEventStore().readyUnits.push(
        new Unit(
          generateKey("unit"),
          trained.key,
          this.playerKey.value,
          this.tileKey,
          this.key,
          // eslint-disable-next-line
        ) as any,
      );
    }
  }
}
