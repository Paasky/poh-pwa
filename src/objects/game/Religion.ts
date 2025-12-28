import { hasMany, hasOne } from "@/objects/game/_relations";
import { TypeObject } from "@/types/typeObjects";
import { GameKey, GameObjAttr, GameObject } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import type { Citizen } from "@/objects/game/Citizen";
import type { Player } from "@/objects/game/Player";
import type { City } from "@/objects/game/City";
import { useEventStore } from "@/stores/eventStore";
import { ReligionHasEvolved, ReligionHasNewType } from "@/events/Religion";

export type ReligionStatus = "myths" | "gods" | "dogmas";

export class Religion extends GameObject {
  constructor(
    key: GameKey,
    public name: string,
    public cityKey: GameKey,
    public foundedTurn: number,
    public status: ReligionStatus = "myths",
    public myths: TypeObject[] = [],
    public gods: TypeObject[] = [],
    public dogmas: TypeObject[] = [],
    public knownByPlayerKeys = new Set<GameKey>(),
  ) {
    super(key);

    hasOne<City>(this, "cityKey");
    hasMany<Citizen>(this, "citizenKeys");
    hasMany<Player>(this, "playerKeys");
    hasMany<Player>(this, "knownByPlayerKeys");
  }

  static attrsConf: GameObjAttr[] = [
    { attrName: "name" },
    {
      attrName: "cityKey",
      related: { theirKeyAttr: "holyCityForKeys" },
    },
    { attrName: "foundedTurn" },
    { attrName: "status", isOptional: true },
    { attrName: "myths", isOptional: true, isTypeObjArray: true },
    { attrName: "gods", isOptional: true, isTypeObjArray: true },
    { attrName: "dogmas", isOptional: true, isTypeObjArray: true },
    {
      attrName: "knownByPlayerKeys",
      isOptional: true,
      related: { theirKeyAttr: "knownReligionKeys", isManyToMany: true },
    },
  ];

  /*
   * Attributes
   */

  /*
   * Relations
   */
  citizenKeys = new Set<GameKey>();
  declare citizens: Citizen[];

  declare city: City;

  playerKeys = new Set<GameKey>();
  declare players: Player[];

  declare knownByPlayers: Player[];

  /*
   * Computed
   */
  get canEvolve(): boolean {
    // Can only evolve if can select a new type
    if (!this.canSelect) return false;

    switch (this.status) {
      case "myths":
        return this.myths.length > 3;
      case "gods":
        return this.gods.length > 6;
      default:
        return false;
    }
  }

  get canSelect(): boolean {
    // Prevent crashing when objStore is not fully loaded yet
    if (!useObjectsStore().ready) return false;

    const holyCityOwner = this.city.player;
    // If the holy city owner doesn't follow the religion: can never select
    if (holyCityOwner.religionKey !== this.key) {
      return false;
    }

    return holyCityOwner.storage.amount("yieldType:faith") >= this.faithToGrow;
  }

  get faithToGrow(): number {
    return Math.round(((this.dogmas.length + this.gods.length + this.myths.length) * 7) ** 1.2);
  }

  get selectableDogmas(): TypeObject[] {
    if (this.status !== "dogmas") return [];

    const selectable: TypeObject[] = [];
    for (const dogma of useObjectsStore().getClassTypes("dogmaType")) {
      // Category already chosen
      if (this.dogmas.some((m) => m.category === dogma.category)) {
        continue;
      }

      if (dogma.requires.isEmpty || dogma.requires.isSatisfied(this.dogmas)) {
        selectable.push(dogma);
      }
    }

    return selectable;
  }

  get selectableGods(): TypeObject[] {
    if (this.status !== "gods") return [];

    const selectable: TypeObject[] = [];
    for (const god of useObjectsStore().getClassTypes("godType")) {
      // Category already chosen
      if (this.gods.some((m) => m.category === god.category)) {
        continue;
      }

      if (god.requires.isEmpty || god.requires.isSatisfied(this.gods)) {
        selectable.push(god);
      }
    }

    return selectable;
  }

  get selectableMyths(): TypeObject[] {
    if (this.status !== "myths") return [];

    const selectable: TypeObject[] = [];
    for (const myth of useObjectsStore().getClassTypes("mythType")) {
      // Category already chosen
      if (this.myths.some((m) => m.category === myth.category)) {
        continue;
      }

      if (myth.requires.isEmpty || myth.requires.isSatisfied(this.myths)) {
        selectable.push(myth);
      }
    }

    return selectable;
  }

  get types(): TypeObject[] {
    return [this.concept, ...this.myths, ...this.gods, ...this.dogmas];
  }

  /*
   * Actions
   */
  startTurn(): void {
    //
  }

  evolve(): void {
    if (!this.canEvolve) {
      throw new Error(`Can't evolve ${this.name}`);
    }
    switch (this.status) {
      case "myths":
        this.status = "gods";
        break;
      case "gods":
        this.status = "dogmas";
        break;
      default:
        throw new Error(`Can't evolve ${this.name}`);
    }

    useEventStore().turnEvents.push(new ReligionHasEvolved(this));
  }

  selectMyth(myth: TypeObject): void {
    if (this.myths.includes(myth)) {
      throw new Error(`Myth ${myth.name} already selected`);
    }
    this.myths.push(myth);

    useEventStore().turnEvents.push(new ReligionHasNewType(this, myth));
  }

  selectGod(god: TypeObject): void {
    if (this.gods.includes(god)) {
      throw new Error(`God ${god.name} already selected`);
    }
    this.gods.push(god);

    useEventStore().turnEvents.push(new ReligionHasNewType(this, god));
  }

  selectDogma(dogma: TypeObject, keepGod?: TypeObject): void {
    if (this.dogmas.includes(dogma)) {
      throw new Error(`Dogma ${dogma.name} already selected`);
    }

    if (dogma.specials.includes("specialType:canHaveOnlyOneGod")) {
      if (!keepGod || !this.gods.includes(keepGod)) {
        throw new Error(`Can only keep one selected God with ${dogma.name}`);
      }
      this.gods = [keepGod];
    }

    this.dogmas.push(dogma);

    useEventStore().turnEvents.push(new ReligionHasNewType(this, dogma));
  }
}
