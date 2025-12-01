import { hasMany, hasOne } from "@/objects/game/_mixins";
import { computed, ref } from "vue";
import { ConstructionQueue, TrainingQueue } from "@/objects/Queues";
import { TypeStorage } from "@/objects/storage";
import { Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { Religion } from "@/objects/game/Religion";
import { Player } from "@/objects/game/Player";
import { useObjectsStore } from "@/stores/objectStore";
import { Citizen } from "@/objects/game/Citizen";
import { Tile } from "@/objects/game/Tile";
import { TradeRoute } from "@/objects/game/TradeRoute";
import { Unit } from "@/objects/game/Unit";

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
    this.playerKey.value = playerKey;
    this.tileKey = tileKey;
    this.name.value = name;
    this.canAttack.value = canAttack;
    this.health.value = health;
    this.isCapital.value = isCapital;
    this.origPlayerKey = origPlayerKey ?? playerKey;
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

  name = ref("");
  canAttack = ref(false);
  health = ref(100);
  isCapital = ref(false);

  constructionQueue = new ConstructionQueue();
  trainingQueue = new TrainingQueue();
  storage = new TypeStorage();

  trainableDesigns = computed(() => this.player.value.designs.value);

  citizenKeys = ref([] as GameKey[]);
  citizens = hasMany(this.citizenKeys, Citizen);

  holyCityForKeys = ref([] as GameKey[]);
  holyCityFor = hasMany(this.holyCityForKeys, Religion);

  playerKey = ref<GameKey>("" as GameKey);
  player = hasOne(this.playerKey, Player);

  origPlayerKey: GameKey;
  origPlayer = computed(() => useObjectsStore().get(this.origPlayerKey) as Player);

  tileKey = "" as GameKey;
  tile = computed(() => useObjectsStore().get(this.tileKey) as Tile);

  tradeRouteKeys = ref([] as GameKey[]);
  tradeRoutes = hasMany(this.tradeRouteKeys, TradeRoute);

  unitKeys = ref([] as GameKey[]);
  units = hasMany(this.unitKeys, Unit);

  private _tileYields = computed(() =>
    this.tile.value.yields.value.only(this.concept.inheritYieldTypes!, [this.concept]),
  );

  private _citizenYields = computed((): Yields => {
    const inherit = this.concept.inheritYieldTypes!;
    return new Yields(this.citizens.value.flatMap((c) => c.yields.value.only(inherit).all()));
  });

  yields = computed(
    (): Yields => new Yields([...this._tileYields.value.all(), ...this._citizenYields.value.all()]),
  );
}
