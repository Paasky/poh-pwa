import { canHaveOne, hasOne } from "@/Common/Models/_Relations";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { Yields } from "@/Common/Objects/Yields";
import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import type { City } from "@/Common/Models/City";
import type { Player } from "@/Common/Models/Player";
import type { Culture } from "@/Common/Models/Culture";
import type { Religion } from "@/Common/Models/Religion";
import type { Tile } from "@/Common/Models/Tile";
import { getNeighbors } from "@/helpers/mapTools";
import { getRandom } from "@/helpers/arrayTools";
import { useEventStore } from "@/stores/eventStore";
import { CitizenGained, CitizenLost } from "@/events/Citizen";
import { useObjectsStore } from "@/stores/objectStore";
import { Construction } from "@/Common/Models/Construction";
import { useDataBucket } from "@/Data/useDataBucket";

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
    this.city.citizenKeys.add(this.key);

    this.pickTile();

    useEventStore().turnEvents.push(new CitizenGained(this, "growth"));
  }

  delete(reason: string) {
    this.city.citizenKeys.delete(this.key);
    this.culture.citizenKeys.delete(this.key);
    this.player.citizenKeys.delete(this.key);
    if (this.religion) {
      this.religion.citizenKeys.delete(this.key);
    }
    this.tile.citizenKeys.delete(this.key);

    delete useObjectsStore()._gameObjects[this.key];

    useEventStore().turnEvents.push(new CitizenLost(this.city, this.tile, reason));
  }

  migrate(toCity: City) {
    const fromCity = this.city;

    fromCity.citizenKeys.delete(this.key);
    this.player.citizenKeys.delete(this.key);

    useEventStore().turnEvents.push(
      new CitizenLost(
        fromCity,
        this.tile,
        `migration to ${toCity.name} (${toCity.player.name})`,
        this,
      ),
    );

    this.cityKey = toCity.key;
    toCity.citizenKeys.add(this.key);
    this.pickTile();

    useEventStore().turnEvents.push(
      new CitizenGained(this, `immigrated from ${fromCity.name} (${fromCity.player.name})`),
    );
  }

  pickTile() {
    if (this.tileKey) {
      this.tile.citizenKeys.delete(this.key);
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

    this.tile.citizenKeys.add(this.key);
  }
}
