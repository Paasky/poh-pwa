import { TypeObject } from "@/Common/Objects/TypeObject";
import { TypeKey } from "@/Common/Objects/Common";
import { GameKey, ObjectWithProps } from "@/Common/Models/_GameModel";
import { Player } from "@/Common/Models/Player";
import { useDataBucket } from "@/Data/useDataBucket";
import { computedProp, hasOne } from "@/Common/Models/_Relations";
import { sort } from "@/helpers/collectionTools";
import { Yields, YieldTypeKey } from "@/Common/Objects/Yields";

export class Research implements ObjectWithProps {
  constructor(public playerKey: GameKey) {
    hasOne<Player>(this, "playerKey");
  }

  declare player: Player;

  researched: Set<TypeObject> = new Set();
  researching: Record<TypeKey, { progress: number; target: TypeObject }> = {};
  current: TypeObject | null = null;
  queue: TypeObject[] = [];
  updateWatchers = [] as ((changes: Partial<ObjectWithProps>) => void)[];

  get era(): TypeObject | null {
    if (!this.researched.size) return null;

    let highestYTech = null as TypeObject | null;
    for (const tech of this.researched) {
      if (!highestYTech || tech.y! > highestYTech.y!) highestYTech = tech;
    }

    return highestYTech ? this.getEra(highestYTech) : null;
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

  complete(tech: TypeObject) {
    if (this.researched.has(tech)) return;

    // It's now researched
    this.researched.add(tech);
    delete this.researching[tech.key];

    // Remove from current and queue if it was in either
    if (this.current === tech) this.current = null;
    this.queue = this.queue.filter((t) => t !== tech);

    // Not researching anything anymore, and there is something in the queue: start next in the queue
    if (!this.current && this.queue.length) this.current = this.queue[0];
  }

  getEra(tech: TypeObject): TypeObject {
    return useDataBucket().getType(tech.category as TypeKey);
  }

  getProgress(tech: TypeObject) {
    return this.researching[tech.key]?.progress ?? 0;
  }

  addProgress(tech: TypeObject, amount: number) {
    if (!this.researching[tech.key]) {
      this.researching[tech.key] = { progress: 0, target: tech };
    }
    const progress = this.researching[tech.key].progress;
    this.researching[tech.key].progress = Math.round(progress + amount);

    // Did it complete?
    if (progress >= tech.scienceCost!) {
      this.complete(tech);

      // Add overflow to player storage
      this.player.storage.add("yieldType:science", progress - tech.scienceCost!);
    }
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
    if (!this.current) return 0;

    const sciencePerTurn = this.player.yields.getLumpAmount("yieldType:science");

    if (sciencePerTurn <= 0) return Infinity;

    const costLeft = this.current.scienceCost! - this.getProgress(this.current as TypeObject);

    return Math.ceil(costLeft / sciencePerTurn);
  }

  startTurn() {
    if (!this.current) return;

    this.addProgress(this.current as TypeObject, this.player.storage.takeAll("yieldType:science"));
  }

  ////// v0.1

  get specialTypes(): Set<TypeObject> {
    return this.computed(
      "_specialTypes",
      () => {
        const bucket = useDataBucket();
        const types = new Set<TypeObject>();
        this.researched.forEach((tech) => {
          types.add(tech);
          tech.specials.forEach((typeKey) => types.add(bucket.getType(typeKey)));
        });

        return types;
      },
      ["researched"],
    );
  }

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "_yields",
      () => {
        const yields = new Yields();
        const notTypes = new Set<YieldTypeKey>(["yieldType:science"]);
        this.researched.forEach((tech) => yields.add(...tech.yields.not(notTypes).all()));

        return yields;
      },
      ["researched"],
    );
  }

  protected computed<ValueT>(
    privatePropName: string,
    getter: () => ValueT,
    watchProps?: (keyof this)[],
  ): ValueT {
    return computedProp(this, privatePropName, getter, watchProps);
  }
}
