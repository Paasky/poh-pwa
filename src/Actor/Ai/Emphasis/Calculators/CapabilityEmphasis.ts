import { CategoryEmphasis, EmphasisReason } from "@/Actor/Ai/AiTypes";
import { CommonEmphasis } from "@/Actor/Ai/Emphasis/Calculators/_CommonEmphasis";

export class CapabilityEmphasis extends CommonEmphasis {
  calculate(): CategoryEmphasis {
    const reasons: EmphasisReason[] = [];

    // Our Military
    // - if no enemy military units: 20p per unit
    // - else use our combined military unit production cost vs others: 0: <= 1:2, 50: 1:1, 100: >= 2:1
    // use unit.design.productionCost
    const { ourMilitaryCost, enemyMilitaryCost, ourMilitaryCount } = this.getMilitaryStats();
    if (enemyMilitaryCost === 0) {
      if (ourMilitaryCount > 0) {
        reasons.push({
          type: "ourMilitary",
          value: Math.min(100, ourMilitaryCount * 20),
        });
      }
    } else {
      const militaryValue = this.ratioToValue(ourMilitaryCost, enemyMilitaryCost);
      if (militaryValue > 0) {
        reasons.push({
          type: "ourMilitary",
          value: militaryValue,
        });
      }
    }

    // Our Agents
    // - if no enemy agent units: 20p per unit
    // - else use our combined agent unit production cost vs others: 0: <= 1:2, 50: 1:1, 100: >= 2:1
    const { ourAgentCost, enemyAgentCost, ourAgentCount } = this.getAgentStats();
    if (enemyAgentCost === 0) {
      if (ourAgentCount > 0) {
        reasons.push({
          type: "ourAgents",
          value: Math.min(100, ourAgentCount * 20),
        });
      }
    } else {
      const agentValue = this.ratioToValue(ourAgentCost, enemyAgentCost);
      if (agentValue > 0) {
        reasons.push({
          type: "ourAgents",
          value: agentValue,
        });
      }
    }

    // Our Culture
    // - if no other culture citizens: 20p per citizen
    // - else use our culture citizen count vs other cultures count: 0: <= 1:2, 50: 1:1, 100: >= 2:1
    const { ourCultureCount, otherCultureCount } = this.getCultureStats();
    if (otherCultureCount === 0) {
      if (ourCultureCount > 0) {
        reasons.push({
          type: "ourCulture",
          value: Math.min(100, ourCultureCount * 20),
        });
      }
    } else {
      const cultureValue = this.ratioToValue(ourCultureCount, otherCultureCount);
      if (cultureValue > 0) {
        reasons.push({
          type: "ourCulture",
          value: cultureValue,
        });
      }
    }

    // Our Faith
    // - if no other faith citizens: 20p per citizen
    // - else use our faith citizen count vs other faiths count: 0: <= 1:2, 50: 1:1, 100: >= 2:1
    const { ourFaithCount, otherFaithCount } = this.getFaithStats();
    if (otherFaithCount === 0) {
      if (ourFaithCount > 0) {
        reasons.push({
          type: "ourFaith",
          value: Math.min(100, ourFaithCount * 20),
        });
      }
    } else {
      const faithValue = this.ratioToValue(ourFaithCount, otherFaithCount);
      if (faithValue > 0) {
        reasons.push({
          type: "ourFaith",
          value: faithValue,
        });
      }
    }

    return this.buildResult("capability", reasons);
  }

  private getMilitaryStats() {
    let ourMilitaryCost = 0;
    let ourMilitaryCount = 0;
    let enemyMilitaryCost = 0;

    for (const tile of this.locality.tiles) {
      for (const unit of tile.units.values()) {
        if (unit.isMilitary) {
          if (unit.playerKey === this.player.key) {
            ourMilitaryCost += unit.design.productionCost;
            ourMilitaryCount++;
          } else {
            enemyMilitaryCost += unit.design.productionCost;
          }
        }
      }
    }

    return { ourMilitaryCost, enemyMilitaryCost, ourMilitaryCount };
  }

  private getAgentStats() {
    let ourAgentCost = 0;
    let ourAgentCount = 0;
    let enemyAgentCost = 0;

    for (const tile of this.locality.tiles) {
      for (const unit of tile.units.values()) {
        if (unit.isAgent) {
          if (unit.playerKey === this.player.key) {
            ourAgentCost += unit.design.productionCost;
            ourAgentCount++;
          } else {
            enemyAgentCost += unit.design.productionCost;
          }
        }
      }
    }

    return { ourAgentCost, enemyAgentCost, ourAgentCount };
  }

  private getCultureStats() {
    let ourCultureCount = 0;
    let otherCultureCount = 0;

    for (const tile of this.locality.tiles) {
      for (const citizen of tile.citizens.values()) {
        if (citizen.cultureKey === this.player.cultureKey) {
          ourCultureCount++;
        } else {
          otherCultureCount++;
        }
      }
    }

    return { ourCultureCount, otherCultureCount };
  }

  private getFaithStats() {
    let ourFaithCount = 0;
    let otherFaithCount = 0;

    for (const tile of this.locality.tiles) {
      for (const citizen of tile.citizens.values()) {
        if (citizen.religionKey === this.player.religionKey) {
          ourFaithCount++;
        } else if (citizen.religionKey !== null) {
          otherFaithCount++;
        }
      }
    }

    return { ourFaithCount, otherFaithCount };
  }
}
