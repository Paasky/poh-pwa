import { CategoryEmphasis, EmphasisCategory, Locality } from "@/Actor/Ai/AiTypes";
import { Player } from "@/Common/Models/Player";
import { CapabilityEmphasis } from "@/Actor/Ai/Emphasis/Calculators/CapabilityEmphasis";
import { UrgencyEmphasis } from "@/Actor/Ai/Emphasis/Calculators/UrgencyEmphasis";
import { DenyEmphasis } from "@/Actor/Ai/Emphasis/Calculators/DenyEmphasis";
import { GainEmphasis } from "@/Actor/Ai/Emphasis/Calculators/GainEmphasis";
import { RewardEmphasis } from "@/Actor/Ai/Emphasis/Calculators/RewardEmphasis";
import { RiskEmphasis } from "@/Actor/Ai/Emphasis/Calculators/RiskEmphasis";

export function localityEmphasis(
  player: Player,
  locality: Locality,
): Map<EmphasisCategory, CategoryEmphasis> {
  const out = new Map<EmphasisCategory, CategoryEmphasis>();

  // Calculate emphasis for each category
  [
    new CapabilityEmphasis(player, locality).calculate(),
    new DenyEmphasis(player, locality).calculate(),
    new GainEmphasis(player, locality).calculate(),
    new RewardEmphasis(player, locality).calculate(),
    new RiskEmphasis(player, locality).calculate(),
    new UrgencyEmphasis(player, locality).calculate(),
  ].forEach((emphasis) => {
    out.set(emphasis.category, emphasis);
  });

  return out;
}
