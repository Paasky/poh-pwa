import { computed, ref } from "vue";
import { TypeObject } from "@/types/typeObjects";
import { UnitStatus } from "@/objects/game/Unit";
import { Yields } from "@/objects/yield";
import { CatKey, roundToTenth, TypeKey } from "@/types/common";
import { GameKey } from "@/objects/game/_GameObject";
import { useObjectsStore } from "@/stores/objectStore";
import { Player } from "@/objects/game/Player";

export class Government {
  constructor(playerKey: GameKey) {
    this.playerKey = playerKey;
  }
  playerKey: GameKey;
  player = computed(() => useObjectsStore().get(this.playerKey) as Player);

  corruption = ref(0);
  discontent = ref(0);

  policies = ref([] as TypeObject[]);
  selectablePolicies = computed(() =>
    this.player.value.knownTypes.value.filter((t) => t.class === "policyType"),
  );

  hasElections = computed(() =>
    this.policies.value.some((p) => p.specials.includes("specialType:elections")),
  );
  nextElection = ref(0);

  canBuyBuildings = computed(
    () => !this.policies.value.some((p) => p.specials.includes("specialType:cannotBuyBuildings")),
  );
  canControlConstruction = computed(
    () =>
      !this.policies.value.some((p) => p.specials.includes("specialType:forceAutomaticBuildQueue")),
  );
  canControlTraining = computed(
    () => !this.policies.value.some((p) => p.specials.includes("specialType:cannotBuildUnits")),
  );
  canDeclineTrade = computed(
    () => !this.policies.value.some((p) => p.specials.includes("specialType:cannotDeclineTrade")),
  );
  canLevyUnits = computed(() =>
    this.policies.value.some((p) => p.specials.includes("specialType:canLevy")),
  );
  canTradeNonAllies = computed(
    () => !this.policies.value.some((p) => p.specials.includes("specialType:cannotTradeNonAllies")),
  );
  hasStateReligion = computed(() =>
    this.policies.value.some((p) => p.specials.includes("specialType:forcedStateReligion")),
  );
  unitStartStatus = computed(
    (): UnitStatus =>
      this.policies.value.some((p) => p.specials.includes("specialType:canMobilize"))
        ? "reserve"
        : "regular",
  );

  yields = computed(() => new Yields(this.policies.value.flatMap((p) => p.yields.all())));

  setPolicies(policies: TypeObject[]) {
    if (this.hasElections.value)
      throw new Error(`Player ${this.player.value.name} cannot change policy with elections`);
    const errors = [] as string[];
    policies.forEach((p) => {
      if (!this.selectablePolicies.value.includes(p))
        errors.push(`Player ${this.player.value.name} cannot select policy ${p.name}`);
      if (this.policies.value.includes(p))
        errors.push(`Player ${this.player.value.name} already has policy ${p.name}`);
    });
    if (errors.length) throw new Error(errors.join("\n"));

    // Remove any prev policy with the same category
    const newPolicies = this.policies.value.filter(
      (p) => !policies.some((np) => np.category === p.category),
    );
    newPolicies.push(...policies);

    // Set Policies & add discontent (100%/policy)
    this.policies.value = newPolicies;
    this.discontent.value = roundToTenth(this.discontent.value + policies.length * 100);
  }

  runElections() {
    if (!this.hasElections.value)
      throw new Error(`Player ${this.player.value.name} cannot run elections`);
    if (this.nextElection.value > 0)
      throw new Error(`Player ${this.player.value.name} cannot run elections yet`);

    // Find the top policy per category (top = most citizens with policy)
    const countedPolicies = {} as Record<
      CatKey,
      Record<TypeKey, { policy: TypeObject; citizens: number }>
    >;
    this.selectablePolicies.value.forEach((p) => {
      const cat = p.category as CatKey;
      if (!countedPolicies[cat]) countedPolicies[cat] = {};
      countedPolicies[cat][p.key] = {
        policy: p as TypeObject,
        citizens: this.player.value.citizens.value.filter((c) => c.policy.value === p).length,
      };
    });
    const topPolicies = {} as Record<CatKey, TypeObject>;
    for (const cat in countedPolicies) {
      const sorted = Object.values(countedPolicies[cat as CatKey]).sort(
        (a, b) => b.citizens - a.citizens,
      );
      topPolicies[cat as CatKey] = sorted[0].policy;
    }

    // Filter out top policies that are already selected and set those
    this.setPolicies(Object.values(topPolicies).filter((p) => !this.policies.value.includes(p)));

    // Remove up to 100% discontent
    this.discontent.value = Math.max(0, roundToTenth(this.discontent.value - 100));

    // Set next elections in 25 turns
    this.nextElection.value = 25;
  }

  startTurn() {
    // Corruption (negative disorder)
    // Elections: Go up +1%/t for 1st 100t, then speed up to +3%/t
    // Authoritarian: Go up +2%/t for 1st 100t, then speed up to +4%/t
    const slow = this.hasElections.value ? 1 : 2;
    const quick = this.hasElections.value ? 3 : 4;
    this.corruption.value = roundToTenth(
      this.corruption.value + (this.corruption.value < slow * 100 ? slow : quick),
    );

    if (this.hasElections.value) {
      this.nextElection.value = Math.max(0, this.nextElection.value - 1);

      // Disorder (negative happiness)
      if (this.nextElection.value > 0) {
        // Discontent increases slowly (+2%/t)
        this.discontent.value = roundToTenth(this.discontent.value + 2);
      } else {
        // Discontent increases quickly (+20%/t) if ignoring elections
        this.discontent.value = roundToTenth(this.discontent.value + 20);
      }
    } else {
      // No elections -> Discontent disappears slowly (2%/t)
      this.discontent.value = Math.max(0, roundToTenth(this.discontent.value - 2));
    }
  }
}
