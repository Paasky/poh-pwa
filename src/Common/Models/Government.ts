import { TypeObject } from "@/Common/Objects/TypeObject";
import { UnitStatus } from "@/Common/Models/Unit";
import { Yield, Yields } from "@/Common/Objects/Yields";
import { CatKey, roundToTenth, TypeKey } from "@/Common/Objects/Common";
import { GameKey, GameObjAttr, GameObject } from "@/Common/Models/_GameModel";
import { useDataBucket } from "@/Data/useDataBucket";
import { Player } from "@/Common/Models/Player";

export class Government extends GameObject {
  constructor(
    key: GameKey,
    public playerKey: GameKey,
    public corruption = 0,
    public discontent = 0,
    public policies: Set<TypeObject> = new Set(),
    public nextElection = 0,
  ) {
    super(key);
  }

  static attrsConf: GameObjAttr[] = [
    {
      attrName: "playerKey",
      related: { theirKeyAttr: "governmentKey", isOne: true },
    },
    { attrName: "corruption", isOptional: true },
    { attrName: "discontent", isOptional: true },
    { attrName: "policies", isOptional: true, isTypeObjArray: true },
    { attrName: "nextElection", isOptional: true },
  ];

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
        this.policies.forEach((policies) => {
          types.add(policies);
          policies.specials.forEach((typeKey) => types.add(bucket.getType(typeKey)));
        });

        return types;
      },
      { props: ["policies"] },
    );
  }

  // My Yield output
  get yields(): Yields {
    return this.computed(
      "yields",
      () => {
        const yields = new Yields();
        this.policies.forEach((policy) => yields.add(...policy.yields.all()));

        if (this.corruption) {
          yields.add({
            type: "yieldType:order",
            amount: -this.corruption,
            method: "percent",
            for: new Set<TypeKey>(["conceptType:citizen"]),
            vs: new Set(),
          } as Yield);
        }

        if (this.discontent) {
          yields.add({
            type: "yieldType:happiness",
            amount: -this.discontent,
            method: "percent",
            for: new Set<TypeKey>(["conceptType:citizen"]),
            vs: new Set(),
          } as Yield);
        }

        return yields;
      },
      { props: ["policies", "corruption", "discontent"] },
    );
  }

  get selectablePolicies(): Set<TypeObject> {
    return this.player.knownTypes.filter((t) => t.class === "policyType");
  }

  get hasElections(): boolean {
    return this.policies.some((p) => p.specials.includes("specialType:elections"));
  }

  get canBuyBuildings(): boolean {
    return !this.policies.some((p) => p.specials.includes("specialType:cannotBuyBuildings"));
  }
  get canControlConstruction(): boolean {
    return !this.policies.some((p) => p.specials.includes("specialType:forceAutomaticBuildQueue"));
  }
  get canControlTraining(): boolean {
    return !this.policies.some((p) => p.specials.includes("specialType:cannotBuildUnits"));
  }
  get canDeclineTrade(): boolean {
    return !this.policies.some((p) => p.specials.includes("specialType:cannotDeclineTrade"));
  }
  get canLevyUnits(): boolean {
    return this.policies.some((p) => p.specials.includes("specialType:canLevy"));
  }
  get canTradeNonAllies(): boolean {
    return !this.policies.some((p) => p.specials.includes("specialType:cannotTradeNonAllies"));
  }
  get hasStateReligion(): boolean {
    return this.policies.some((p) => p.specials.includes("specialType:forcedStateReligion"));
  }
  get unitStartStatus(): UnitStatus {
    return this.policies.some((p) => p.specials.includes("specialType:canMobilize"))
      ? "reserve"
      : "regular";
  }

  /*
   * Actions
   */
  setPolicies(policies: Set<TypeObject>) {
    if (this.hasElections)
      throw new Error(`Player ${this.player.name} cannot change policy with elections`);
    const errors = [] as string[];
    policies.forEach((p) => {
      if (!this.selectablePolicies.has(p))
        errors.push(`Player ${this.player.name} cannot select policy ${p.name}`);
      if (this.policies.has(p))
        errors.push(`Player ${this.player.name} already has policy ${p.name}`);
    });
    if (errors.length) throw new Error(errors.join("\n"));

    // Remove any prev policy with the same category
    const newPolicies = this.policies.filter(
      (p) => !policies.some((np) => np.category === p.category),
    );
    newPolicies.push(...policies);

    // Set Policies & add discontent (100%/policy)
    this.policies = newPolicies;
    this.discontent = roundToTenth(this.discontent + policies.size * 100);
  }

  runElections() {
    if (!this.hasElections) throw new Error(`Player ${this.player.name} cannot run elections`);
    if (this.nextElection > 0)
      throw new Error(`Player ${this.player.name} cannot run elections yet`);

    // Find the top policy per category (top = most citizens with policy)
    const countedPolicies = {} as Record<
      CatKey,
      Record<TypeKey, { policy: TypeObject; citizens: number }>
    >;
    this.selectablePolicies.forEach((p) => {
      const cat = p.category as CatKey;
      if (!countedPolicies[cat]) countedPolicies[cat] = {};
      countedPolicies[cat][p.key] = {
        policy: p as TypeObject,
        citizens: this.player.citizens.filter((c) => c.policy === p).size,
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
    this.setPolicies(Object.values(topPolicies).filter((p) => !this.policies.has(p)));

    // Remove up to 100% discontent
    this.discontent = Math.max(0, roundToTenth(this.discontent - 100));

    // Set next elections in 25 turns
    this.nextElection = 25;
  }

  startTurn() {
    // Corruption (negative disorder)
    // Elections: Go up +1%/t for 1st 100t, then speed up to +3%/t
    // Authoritarian: Go up +2%/t for 1st 100t, then speed up to +4%/t
    const slow = this.hasElections ? 1 : 2;
    const quick = this.hasElections ? 3 : 4;
    this.corruption = roundToTenth(this.corruption + (this.corruption < slow * 100 ? slow : quick));

    if (this.hasElections) {
      this.nextElection = Math.max(0, this.nextElection - 1);

      // Disorder (negative happiness)
      if (this.nextElection > 0) {
        // Discontent increases slowly (+2%/t)
        this.discontent = roundToTenth(this.discontent + 2);
      } else {
        // Discontent increases quickly (+20%/t) if ignoring elections
        this.discontent = roundToTenth(this.discontent + 20);
      }
    } else {
      // No elections -> Discontent disappears slowly (2%/t)
      this.discontent = Math.max(0, roundToTenth(this.discontent - 2));
    }
  }
}
