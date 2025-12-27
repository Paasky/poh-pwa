import { canHaveOne, hasOne } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { Yields } from "@/objects/yield";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import type { City } from "@/objects/game/City";
import type { Player } from "@/objects/game/Player";
import type { Culture } from "@/objects/game/Culture";
import type { Religion } from "@/objects/game/Religion";
import type { Tile } from "@/objects/game/Tile";
import { getNeighbors } from "@/helpers/mapTools";
import { getRandom } from "@/helpers/arrayTools";
import { useEventStore } from "@/stores/eventStore";
import { CitizenGained, CitizenLost } from "@/events/Citizen";
import { useObjectsStore } from "@/stores/objectStore";
import { Construction } from "@/objects/game/Construction";
import { useDataBucket } from "@/Store/useDataBucket";

export class Citizen extends GameObject {
  constructor(
    key: GameKey,
    public cityKey: GameKey,
    public cultureKey: GameKey,
    public playerKey: GameKey,
    public tileKey: GameKey,
    public religionKey: GameKey | null = null,
    public policy: TypeObject | null = null,
  ) {
    super(key);

    hasOne<City>(this, "cityKey");
    hasOne<Culture>(this, "cultureKey");
    hasOne<Player>(this, "playerKey");
    canHaveOne<Religion>(this, "religionKey");
    hasOne<Tile>(this, "tileKey");
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "cityKey", related: { theirKeyAttr: "citizenKeys" } },
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

  /*
   * Relations
   */
  declare city: City;
  declare culture: Culture;
  declare player: Player;
  declare religion: Religion | null;
  declare tile: Tile;

  /*
   * Computed
   */
  get tileYields(): Yields {
    return this.tile.yields.only(this.concept.inheritYieldTypes!, [this.concept]);
  }

  get work(): Construction | null {
    return this.tile.construction;
  }

  get workYields(): Yields | null {
    return this.work?.yields.only(this.concept.inheritYieldTypes!, [this.concept]) ?? null;
  }

  get yields(): Yields {
    return new Yields([...this.tileYields.all(), ...(this.workYields?.all() ?? [])]);
  }

  /*
   * Actions
   */
  complete() {
    this.city.citizenKeys.push(this.key);

    this.pickTile();

    useEventStore().turnEvents.push(new CitizenGained(this, "growth"));
  }

  delete(reason: string) {
    this.city.citizenKeys = this.city.citizenKeys.filter((k) => k !== this.key);
    this.culture.citizenKeys = this.culture.citizenKeys.filter((k) => k !== this.key);
    this.player.citizenKeys = this.player.citizenKeys.filter((k) => k !== this.key);
    if (this.religion) {
      this.religion.citizenKeys = this.religion.citizenKeys.filter((k) => k !== this.key);
    }
    this.tile.citizenKeys = this.tile.citizenKeys.filter((k) => k !== this.key);

    delete useObjectsStore()._gameObjects[this.key];

    useEventStore().turnEvents.push(new CitizenLost(this.city, this.tile, reason));
  }

  migrate(toCity: City) {
    const fromCity = this.city;

    fromCity.citizenKeys = fromCity.citizenKeys.filter((k) => k !== this.key);
    this.player.citizenKeys = this.player.citizenKeys.filter((k) => k !== this.key);

    useEventStore().turnEvents.push(
      new CitizenLost(
        fromCity,
        this.tile,
        `migration to ${toCity.name} (${toCity.player.name})`,
        this,
      ),
    );

    this.cityKey = toCity.key;
    toCity.citizenKeys.push(this.key);
    this.pickTile();

    useEventStore().turnEvents.push(
      new CitizenGained(this, `immigrated from ${fromCity.name} (${fromCity.player.name})`),
    );
  }

  pickTile() {
    if (this.tileKey) {
      this.tile.citizenKeys = this.tile.citizenKeys.filter((k) => k !== this.key);
    }

    // todo pick tile per city preferences
    const possibleTiles = getNeighbors(
      useDataBucket().world.size,
      this.city.tile,
      useDataBucket().getTiles(),
      "hex",
      3,
    ).filter((n) => n.playerKey === this.playerKey);

    this.tileKey = getRandom(possibleTiles).key;

    this.tile.citizenKeys.push(this.key);
  }
}
