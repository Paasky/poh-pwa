import { TypeObject } from "@/Common/Objects/TypeObject";
import { UnitStatus } from "@/Common/Models/Unit";
import { Yields } from "@/Common/Objects/Yields";
import { CatKey, roundToTenth, TypeKey } from "@/Common/Objects/Common";
import { GameKey } from "@/Common/Models/_GameModel";
import { Player } from "@/Common/Models/Player";
import { hasOne } from "@/Common/Models/_Relations";

export class Government {
  constructor(public playerKey: GameKey) {
    hasOne<Player>(this, "playerKey");
  }

  declare player: Player;

  corruption = 0;
  discontent = 0;

  policies: TypeObject[] = [];

  get selectablePolicies(): TypeObject[] {
    return this.player.knownTypes.filter((t) => t.class === "policyType");
  }

  get hasElections(): boolean {
    return this.policies.some((p) => p.specials.includes("specialType:elections"));
  }

  nextElection = 0;

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

  get yields(): Yields {
    return new Yields(this.policies.flatMap((p) => p.yields.all()));
  }

  setPolicies(policies: TypeObject[]) {
    if (this.hasElections)
      throw new Error(`Player ${this.player.name} cannot change policy with elections`);
    const errors = [] as string[];
    policies.forEach((p) => {
      if (!this.selectablePolicies.includes(p))
        errors.push(`Player ${this.player.name} cannot select policy ${p.name}`);
      if (this.policies.includes(p))
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
    this.discontent = roundToTenth(this.discontent + policies.length * 100);
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
        citizens: this.player.citizens.filter((c) => c.policy === p).length,
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
    this.setPolicies(Object.values(topPolicies).filter((p) => !this.policies.includes(p)));

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
