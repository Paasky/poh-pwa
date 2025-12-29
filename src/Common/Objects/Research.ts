import { TypeObject } from "@/Common/Objects/TypeObject";
import { TypeKey } from "@/Common/Objects/Common";
import { GameKey } from "@/Common/Models/_GameModel";
import { Player } from "@/Common/Models/Player";
import { useDataBucket } from "@/Data/useDataBucket";
import { hasOne } from "@/Common/Models/_Relations";

export class Research {
  constructor(public playerKey: GameKey) {
    hasOne<Player>(this, "playerKey");
  }

  declare player: Player;

  researched: TypeObject[] = [];
  researching: Record<TypeKey, { progress: number; target: TypeObject }> = {};
  current: TypeObject | null = null;
  queue: TypeObject[] = [];

  get era(): TypeObject | null {
    if (!this.researched.length) return null;

    const highestYTech = this.researched.reduce<TypeObject | null>((highest, current) => {
      if (!highest) return current as TypeObject;
      const curY = current.y!;
      const hiY = highest.y!;
      return curY > hiY ? (current as TypeObject) : (highest as TypeObject);
    }, null) as TypeObject;

    return this.getEra(highestYTech);
  }

  addToQueue(tech: TypeObject, reset = true) {
    if (this.researched.includes(tech)) return;

    if (reset) this.queue = [];

    // Anything already in the queue is "in the chain"
    const chain = [...this.queue] as TypeObject[];
    this.collectRequired(tech, chain);

    // Finally, add requested tech to the chain
    chain.push(tech);

    // Deduplicate while preserving order
    const unique = Array.from(new Set(chain));

    // Sort top-to-bottom then left-to-right (fallback if y equal)
    unique.sort((a, b) => a.y! - b.y! || a.x! - b.x!);
    this.queue.push(...unique);
    if (!this.current) this.current = unique[0];
  }

  complete(tech: TypeObject) {
    if (this.researched.includes(tech)) return;

    // It's now researched
    this.researched.push(tech);
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

  isLaterEra(from: TypeObject, to: TypeObject): boolean {
    const eras = useDataBucket()
      .getTypes()
      .filter((t) => t.class === "eraType");
    return eras.indexOf(from) < eras.indexOf(to);
  }

  private collectRequired(target: TypeObject, acc: TypeObject[]): void {
    // Crawl up the required-chain
    target.requires.requireAll.forEach((reqKey) => {
      const required = useDataBucket().getType(reqKey as TypeKey);
      if (
        required.class !== "technologyType" ||
        this.researched.includes(required) ||
        acc.includes(required)
      )
        return;
      acc.push(required);
      this.collectRequired(required, acc);
    });

    // Crawl up the "require any"-chain
    target.requires.requireAny.forEach((anyKeys) => {
      let cheapest: TypeObject | false | null = null;
      anyKeys.forEach((orReqKey) => {
        if (cheapest === false) return;
        const required = useDataBucket().getType(orReqKey as TypeKey);
        if (required.class !== "technologyType" || acc.includes(required)) return;
        if (this.researched.includes(required)) {
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
        acc.push(cheapest);
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
}
