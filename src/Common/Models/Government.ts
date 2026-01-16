import { TypeObject } from "../Static/Objects/TypeObject";
import { UnitStatus } from "./Unit";
import { Yield, Yields } from "../Static/Objects/Yields";
import { roundToTenth } from "../Helpers/basicMath";
import { TypeKey } from "../Static/StaticEnums";
import { GameKey, GameObjAttr, GameObject } from "./_GameModel";
import { useDataBucket } from "../../Data/useDataBucket";
import { Player } from "./Player";

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
      {
        props: ["policies"],
        relations: [{ relName: "policies", relProps: ["specials"] }],
      },
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
      {
        props: ["policies", "corruption", "discontent"],
        relations: [{ relName: "policies", relProps: ["yields"] }],
      },
    );
  }

  get selectablePolicies(): Set<TypeObject> {
    return this.computed(
      "selectablePolicies",
      () => this.player.knownTypes.filter((t) => t.class === "policyType"),
      { relations: [{ relName: "player", relProps: ["knownTypes"] }] },
    );
  }

  get hasElections(): boolean {
    return this.computed(
      "hasElections",
      () => this.policies.some((p) => p.specials.includes("specialType:elections")),
      { props: ["policies"] },
    );
  }

  get canBuyBuildings(): boolean {
    return this.computed(
      "canBuyBuildings",
      () => !this.policies.some((p) => p.specials.includes("specialType:cannotBuyBuildings")),
      { props: ["policies"] },
    );
  }
  get canControlConstruction(): boolean {
    return this.computed(
      "canControlConstruction",
      () => !this.policies.some((p) => p.specials.includes("specialType:forceAutomaticBuildQueue")),
      { props: ["policies"] },
    );
  }
  get canControlTraining(): boolean {
    return this.computed(
      "canControlTraining",
      () => !this.policies.some((p) => p.specials.includes("specialType:cannotBuildUnits")),
      { props: ["policies"] },
    );
  }
  get canDeclineTrade(): boolean {
    return this.computed(
      "canDeclineTrade",
      () => !this.policies.some((p) => p.specials.includes("specialType:cannotDeclineTrade")),
      { props: ["policies"] },
    );
  }
  get canLevyUnits(): boolean {
    return this.computed(
      "canLevyUnits",
      () => this.policies.some((p) => p.specials.includes("specialType:canLevy")),
      { props: ["policies"] },
    );
  }
  get canTradeNonAllies(): boolean {
    return this.computed(
      "canTradeNonAllies",
      () => !this.policies.some((p) => p.specials.includes("specialType:cannotTradeNonAllies")),
      { props: ["policies"] },
    );
  }
  get hasStateReligion(): boolean {
    return this.computed(
      "hasStateReligion",
      () => this.policies.some((p) => p.specials.includes("specialType:forcedStateReligion")),
      { props: ["policies"] },
    );
  }
  get unitStartStatus(): UnitStatus {
    return this.computed(
      "unitStartStatus",
      () =>
        this.policies.some((p) => p.specials.includes("specialType:canMobilize"))
          ? "reserve"
          : "regular",
      { props: ["policies"] },
    );
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
}

export const GovernmentConfig = {
  // Has Elections: Go up +1%/t for 1st 100t, then speed up to +3%/t
  // Authoritarian: Go up +2%/t for 1st 100t, then speed up to +4%/t
  corruption: {
    turnsToFast: 100,
    electedSlowPerTurn: 1,
    electedFastPerTurn: 2,
    authoritarianSlowPerTurn: 3,
    authoritarianFastPerTurn: 4,
    getAmount(hasElections: boolean, currentCorruption: number): number {
      const slow = hasElections ? 1 : 2;
      const quick = hasElections ? 3 : 4;
      const isInFirst100 = currentCorruption < slow * GovernmentConfig.corruption.turnsToFast;
      return isInFirst100 ? slow : quick;
    },
  },

  // Has Elections: Go up +2%/t, but speed up to +20%/t if ignoring elections (elections every 25t)
  // Authoritarian: Go down -2%/t (changing policies bumps up +50% per change)
  discontent: {
    electedPerTurn: 2,
    electedIgnoringElectionsPerTurn: 2,
    authoritarianPerTurn: -2,
    getAmount(hasElections: boolean, isIgnoringElections: boolean): number {
      return hasElections
        ? isIgnoringElections
          ? GovernmentConfig.discontent.electedIgnoringElectionsPerTurn
          : GovernmentConfig.discontent.electedPerTurn
        : GovernmentConfig.discontent.authoritarianPerTurn;
    },
  },

  authoritarian: {
    discontentPerPolicy: 50,
  },

  elections: {
    everyNthTurn: 25,
    removeDiscontent: 100,
  },
};
