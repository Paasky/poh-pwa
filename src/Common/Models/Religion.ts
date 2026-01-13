import { TypeObject } from "@/Common/Objects/TypeObject";
import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import { useDataBucket } from "@/Data/useDataBucket";
import type { Citizen } from "@/Common/Models/Citizen";
import type { Player } from "@/Common/Models/Player";
import type { City } from "@/Common/Models/City";
import { useEventStore } from "@/App/stores/eventStore";
import { ReligionHasEvolved, ReligionHasNewType } from "@/Common/events/Religion";
import { Yields } from "@/Common/Static/Objects/Yields";
import { has } from "@/Common/Helpers/collectionTools";

export type ReligionStatus = "myths" | "gods" | "dogmas";

export class Religion extends GameObject {
  constructor(
    key: GameKey,
    public name: string,
    public cityKey: GameKey,
    public foundedTurn: number,
    public status: ReligionStatus = "myths",
    public myths: Set<TypeObject> = new Set(),
    public gods: Set<TypeObject> = new Set(),
    public dogmas: Set<TypeObject> = new Set(),
    public knownByPlayerKeys = new Set<GameKey>(),
  ) {
    super(key);
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
  get citizens(): Map<GameKey, Citizen> {
    return this.hasMany<Citizen>("citizenKeys");
  }

  get city(): City {
    return this.hasOne<City>("cityKey");
  }

  playerKeys = new Set<GameKey>();
  get players(): Map<GameKey, Player> {
    return this.hasMany<Player>("playerKeys");
  }

  get knownByPlayers(): Map<GameKey, Player> {
    return this.hasMany<Player>("knownByPlayerKeys");
  }

  /*
   * Computed
   */
  get canEvolve(): boolean {
    // Can only evolve if can select a new type
    if (!this.canSelect) return false;

    switch (this.status) {
      case "myths":
        return this.myths.size > 3;
      case "gods":
        return this.gods.size > 6;
      default:
        return false;
    }
  }

  get canSelect(): boolean {
    const holyCityOwner = this.city.player;
    // If the holy city owner doesn't follow the religion: can never select
    if (holyCityOwner.religionKey !== this.key) {
      return false;
    }

    return holyCityOwner.storage.amount("yieldType:faith") >= this.faithToGrow;
  }

  get faithToGrow(): number {
    return Math.round(((this.dogmas.size + this.gods.size + this.myths.size) * 7) ** 1.2);
  }

  get selectableDogmas(): Set<TypeObject> {
    if (this.status !== "dogmas") return new Set();

    const selectable: Set<TypeObject> = new Set();
    for (const dogma of useDataBucket().getClassTypes("dogmaType")) {
      // Category already chosen
      if (has(this.dogmas, (dogma) => dogma.category === dogma.category)) {
        continue;
      }

      if (dogma.requires.isEmpty || dogma.requires.isSatisfied(this.dogmas)) {
        selectable.add(dogma);
      }
    }

    return selectable;
  }

  get selectableGods(): Set<TypeObject> {
    if (this.status !== "gods") return new Set();

    const selectable: Set<TypeObject> = new Set();
    for (const god of useDataBucket().getClassTypes("godType")) {
      // Category already chosen
      if (has(this.gods, (god) => god.category === god.category)) {
        continue;
      }

      if (god.requires.isEmpty || god.requires.isSatisfied(this.gods)) {
        selectable.add(god);
      }
    }

    return selectable;
  }

  get selectableMyths(): Set<TypeObject> {
    if (this.status !== "myths") return new Set();

    const selectable: Set<TypeObject> = new Set();
    for (const myth of useDataBucket().getClassTypes("mythType")) {
      // Category already chosen
      if (has(this.myths, (myth) => myth.category === myth.category)) {
        continue;
      }

      if (myth.requires.isEmpty || myth.requires.isSatisfied(this.myths)) {
        selectable.add(myth);
      }
    }

    return selectable;
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
    if (this.myths.has(myth)) {
      throw new Error(`Myth ${myth.name} already selected`);
    }
    this.myths.add(myth);

    useEventStore().turnEvents.push(new ReligionHasNewType(this, myth));
  }

  selectGod(god: TypeObject): void {
    if (this.gods.has(god)) {
      throw new Error(`God ${god.name} already selected`);
    }
    this.gods.add(god);

    useEventStore().turnEvents.push(new ReligionHasNewType(this, god));
  }

  selectDogma(dogma: TypeObject, keepGod?: TypeObject): void {
    if (this.dogmas.has(dogma)) {
      throw new Error(`Dogma ${dogma.name} already selected`);
    }

    if (dogma.specials.includes("specialType:canHaveOnlyOneGod")) {
      if (!keepGod || !this.gods.has(keepGod)) {
        throw new Error(`Can only keep one selected God with ${dogma.name}`);
      }
      this.gods = new Set([keepGod]);
    }

    this.dogmas.add(dogma);

    useEventStore().turnEvents.push(new ReligionHasNewType(this, dogma));
  }

  ////// v0.1

  get myTypes(): Set<TypeObject> {
    return this.computed(
      "myTypes",
      () => new Set([...this.myths, ...this.gods, ...this.dogmas, this.concept]),
      { props: ["myths", "gods", "dogmas"] },
    );
  }

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "yields",
      () => {
        const yields = new Yields();
        this.myTypes.forEach((type) => yields.add(...type.yields.all()));
        return yields;
      },
      {
        props: ["myths", "gods", "dogmas"],
        relations: [{ relName: "myTypes", relProps: ["yields"] }],
      },
    );
  }
}
