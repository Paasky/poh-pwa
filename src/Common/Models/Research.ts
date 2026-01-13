import { TypeObject } from "@/Common/Objects/TypeObject";
import { TypeKey } from "@/Common/Objects/World";
import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import { useDataBucket } from "@/Data/useDataBucket";
import { sort } from "@/Common/Helpers/collectionTools";
import { Yields, YieldTypeKey } from "@/Common/Static/Objects/Yields";
import { Player } from "@/Common/Models/Player";
import { TypeStorage } from "@/Common/Objects/TypeStorage";

export class Research extends GameObject {
  constructor(
    key: GameKey,
    public playerKey: GameKey,
    public researched: Set<TypeObject> = new Set(),
    public storage: TypeStorage = new TypeStorage(),
    public queue: TypeObject[] = [],
  ) {
    super(key);
    if (queue[0]) this.current = queue[0];
  }

  static attrsConf: GameObjAttr[] = [
    {
      attrName: "playerKey",
      related: { theirKeyAttr: "researchKey", isOne: true },
    },
    { attrName: "researched", isOptional: true, isTypeObjArray: true },
    { attrName: "researching", isOptional: true },
    { attrName: "queue", isOptional: true, isTypeObjArray: true },
  ];

  /*
   * Attributes
   */
  current: TypeObject | null = null;

  /*
   * Relations
   */
  get player(): Player {
    return this.hasOne<Player>("playerKey");
  }

  /*
   * Computed
   */
  get specialTypes(): Set<TypeObject> {
    return this.computed(
      "specialTypes",
      () => {
        const bucket = useDataBucket();
        const types = new Set<TypeObject>();
        this.researched.forEach((tech) => {
          types.add(tech);
          tech.specials.forEach((typeKey) => types.add(bucket.getType(typeKey)));
        });

        return types;
      },
      { props: ["researched"] },
    );
  }

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "yields",
      () => {
        const yields = new Yields();
        const notTypes = new Set<YieldTypeKey>(["yieldType:science"]);
        this.researched.forEach((tech) => yields.add(...tech.yields.not(notTypes).all()));

        return yields;
      },
      { props: ["researched"] },
    );
  }

  get era(): TypeObject | null {
    return this.computed(
      "era",
      () => {
        if (!this.researched.size) return null;

        let highestYTech = null as TypeObject | null;
        for (const tech of this.researched) {
          if (!highestYTech || tech.y! > highestYTech.y!) highestYTech = tech;
        }

        return highestYTech ? this.getEra(highestYTech) : null;
      },
      { props: ["researched"] },
    );
  }

  addToQueue(tech: TypeObject, reset = true) {
    if (this.researched.has(tech)) return;

    if (reset) this.queue = [];

    // Anything already in the queue is "in the chain"
    const chain = new Set<TypeObject>([...this.queue]);
    this.collectRequired(tech, chain);

    // Finally, add requested tech to the chain
    chain.add(tech);

    // Sort top-to-bottom then left-to-right (fallback if y equal)
    const unique = sort<Set<TypeObject>, TypeObject>(chain, (a, b) => a.y! - b.y! || a.x! - b.x!);

    unique.forEach((tech) => this.queue.push(tech));
    if (!this.current) this.current = unique[0];
  }

  getEra(tech: TypeObject): TypeObject {
    return useDataBucket().getType(tech.category as TypeKey);
  }

  getProgress(tech: TypeObject) {
    return this.storage.get(tech.key)?.progress ?? 0;
  }

  private collectRequired(target: TypeObject, acc: Set<TypeObject>): void {
    // Crawl up the required-chain
    target.requires.requireAll.forEach((reqKey) => {
      const required = useDataBucket().getType(reqKey as TypeKey);
      if (required.class !== "technologyType" || this.researched.has(required) || acc.has(required))
        return;
      acc.add(required);
      this.collectRequired(required, acc);
    });

    // Crawl up the "require any"-chain
    target.requires.requireAny.forEach((anyKeys) => {
      let cheapest: TypeObject | false | null = null;
      anyKeys.forEach((orReqKey) => {
        if (cheapest === false) return;
        const required = useDataBucket().getType(orReqKey as TypeKey);
        if (required.class !== "technologyType" || acc.has(required)) return;
        if (this.researched.has(required)) {
          cheapest = false;
          return;
        }
        if (
          !cheapest ||
          required.scienceCost! - this.getProgress(required) <
            cheapest.scienceCost! - this.getProgress(cheapest)
        ) {
          cheapest = required;
        }
      });
      if (cheapest) {
        acc.add(cheapest);
        this.collectRequired(cheapest, acc);
      }
    });
  }

  get turnsLeft(): number {
    return this.computed(
      "turnsLeft",
      () => {
        if (!this.current) return 0;

        const sciencePerTurn = this.player.yields.getLumpAmount("yieldType:science");

        if (sciencePerTurn <= 0) return Infinity;

        const costLeft = this.current.scienceCost! - this.getProgress(this.current as TypeObject);

        return Math.ceil(costLeft / sciencePerTurn);
      },
      {
        props: ["current"],
        relations: [{ relName: "player", relProps: ["yields"] }],
      },
    );
  }
}
