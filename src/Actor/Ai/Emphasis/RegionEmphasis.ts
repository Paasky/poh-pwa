import { Player } from "@/Common/Models/Player";
import { CategoryEmphasis, EmphasisCategory, Region } from "@/Actor/Ai/AiTypes";
import { localityEmphasis } from "@/Actor/Ai/Emphasis/LocalityEmphasis";

export function regionEmphasis(
  player: Player,
  region: Region,
): Map<EmphasisCategory, CategoryEmphasis> {
  const out = new Map<EmphasisCategory, CategoryEmphasis>();

  // No localities → no regional signal
  if (region.localities.size === 0) return out;

  // Group all locality emphases by category
  const emphasisByCat = new Map<EmphasisCategory, CategoryEmphasis[]>();
  for (const locality of region.localities) {
    for (const emphasis of localityEmphasis(player, locality).values()) {
      const list = emphasisByCat.get(emphasis.category);
      if (list) {
        list.push(emphasis);
      } else {
        emphasisByCat.set(emphasis.category, [emphasis]);
      }
    }
  }

  // Collapse locality emphases into a single regional emphasis per category
  for (const [category, emphases] of emphasisByCat) {
    if (emphases.length === 0) continue;

    let total = 0;
    let max = 0;

    // Aggregate locality values
    for (const emphasis of emphases) {
      total += emphasis.value;
      if (emphasis.value > max) max = emphasis.value;
    }

    /*
      80–20 rule:
      - If ANY locality is strongly alarmed (>80),
        the entire region is considered alarmed.
      - Otherwise, the region reflects the average situation.
    */
    const value = max > 80 ? max : Math.round(total / emphases.length);

    /*
      Reasons are kept only for explainability/debugging/UI.
      They do not participate in logic.
      To avoid reason explosion, keep only the top 10.
    */
    const reasons = emphases
      .flatMap((e) => e.reasons)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    out.set(category, {
      category,
      value,
      reasons,
    });
  }

  return out;
}
