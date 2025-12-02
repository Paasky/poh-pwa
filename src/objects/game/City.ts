import { hasMany, hasOne } from "@/objects/game/_relations";
import { computed, ComputedRef, Ref, ref } from "vue";
import { ConstructionQueue, TrainingQueue } from "@/objects/Queues";
import { TypeStorage } from "@/objects/storage";
import { Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import type { Citizen } from "@/objects/game/Citizen";
import type { Player } from "@/objects/game/Player";
import type { Religion } from "@/objects/game/Religion";
import type { Tile } from "@/objects/game/Tile";
import type { TradeRoute } from "@/objects/game/TradeRoute";
import type { Unit } from "@/objects/game/Unit";

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

  holyCityForKeys = ref([] as GameKey[]);
  holyCityFor = hasMany<Religion[]>(this.holyCityForKeys, `${this.key}.holyCityFor`);

  origPlayerKey: GameKey;
  origPlayer: ComputedRef<Player>;

  playerKey: Ref<GameKey>;
  player: ComputedRef<Player>;

  tileKey: GameKey;
  tile: ComputedRef<Tile>;

  tradeRouteKeys = ref([] as GameKey[]);
  tradeRoutes = hasMany<TradeRoute>(this.tradeRouteKeys, `${this.key}.tradeRoutes`);

  unitKeys = ref([] as GameKey[]);
  units = hasMany<Unit[]>(this.unitKeys, `${this.key}.units`);

  /*
   * Computed
   */
  citizenYields = computed((): Yields => {
    const inherit = this.concept.inheritYieldTypes!;
    return new Yields(this.citizens.value.flatMap((c) => c.yields.value.only(inherit).all()));
  });

  tileYields = computed(() =>
    this.tile.value.yields.value.only(this.concept.inheritYieldTypes!, [this.concept]),
  );

  trainableDesigns = computed(() => this.player.value.designs.value);

  yields = computed(
    (): Yields => new Yields([...this.tileYields.value.all(), ...this.citizenYields.value.all()]),
  );

  /*
   * Actions
   */
  // todo add here
}
