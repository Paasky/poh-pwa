import { computed, ref } from "vue";
import { TypeObject } from "@/types/typeObjects";
import { TypeKey } from "@/types/common";
import { GameKey } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import { Player } from "@/objects/game/Player";

export class Research {
  constructor(playerKey: GameKey) {
    this.playerKey = playerKey;
  }

  playerKey: GameKey;
  player = computed(() => useObjectsStore().get(this.playerKey) as Player);

  researched = ref<TypeObject[]>([]);
  researching = ref<Record<TypeKey, { progress: number; target: TypeObject }>>({});
  current = ref<TypeObject | null>(null);
  queue = ref<TypeObject[]>([]);
  era = computed((): TypeObject | null => {
    if (!this.researched.value.length) return null;

    const highestYTech = this.researched.value.reduce<TypeObject | null>((highest, current) => {
      if (!highest) return current as TypeObject;
      const curY = current.y!;
      const hiY = highest.y!;
      return curY > hiY ? (current as TypeObject) : (highest as TypeObject);
    }, null) as TypeObject;

    return this.getEra(highestYTech);
  });

  addToQueue(tech: TypeObject, reset = true) {
    if (this.researched.value.includes(tech)) return;

    if (reset) this.queue.value = [];

    // Anything already in the queue is "in the chain"
    const chain = [...this.queue.value] as TypeObject[];
    this.collectRequired(tech, chain);

    // Finally, add requested tech to the chain
    chain.push(tech);

    // Deduplicate while preserving order
    const unique = Array.from(new Set(chain));

    // Sort top-to-bottom then left-to-right (fallback if y equal)
    unique.sort((a, b) => a.y! - b.y! || a.x! - b.x!);
    this.queue.value.push(...unique);
    if (!this.current.value) this.current.value = unique[0];
  }

  complete(tech: TypeObject) {
    if (this.researched.value.includes(tech)) return;

    // It's now researched
    this.researched.value.push(tech);
    delete this.researching.value[tech.key];

    // Remove from current and queue if it was in either
    if (this.current.value === tech) this.current.value = null;
    this.queue.value = this.queue.value.filter((t) => t !== tech);

    // Not researching anything anymore, and there is something in the queue: start next in the queue
    if (!this.current.value && this.queue.value.length) this.current.value = this.queue.value[0];
  }

  getEra(tech: TypeObject): TypeObject {
    return useObjectsStore().getTypeObject(tech.category as TypeKey);
  }

  getProgress(tech: TypeObject) {
    return this.researching.value[tech.key]?.progress ?? 0;
  }

  isLaterEra(from: TypeObject, to: TypeObject): boolean {
    const eras = useObjectsStore().getClassTypes("eraType");
    return eras.indexOf(from) < eras.indexOf(to);
  }

  private collectRequired(target: TypeObject, acc: TypeObject[]): void {
    // Crawl up the required-chain
    target.requires.requireAll.forEach((reqKey) => {
      const required = useObjectsStore().getTypeObject(reqKey as TypeKey);
      if (
        required.class !== "technologyType" ||
        this.researched.value.includes(required) ||
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
        const required = useObjectsStore().getTypeObject(orReqKey as TypeKey);
        if (required.class !== "technologyType" || acc.includes(required)) return;
        if (this.researched.value.includes(required)) {
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

  turnsLeft = computed((): number => {
    if (!this.current.value) return 0;

    const sciencePerTurn = this.player.value.yields.value.getLumpAmount("yieldType:science");

    if (sciencePerTurn <= 0) return Infinity;

    const costLeft =
      this.current.value.scienceCost! - this.getProgress(this.current.value as TypeObject);

    return Math.ceil(costLeft / sciencePerTurn);
  });
}
