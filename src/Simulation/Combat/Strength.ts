import { Construction } from "@/objects/game/Construction";
import { Unit } from "@/objects/game/Unit";
import { City } from "@/objects/game/City";
import { TypeObject } from "@/types/typeObjects";
import { roundToTenth } from "@/types/common";

export const attackStrength = (
  attacker: City | Unit,
  defender: Unit | City | Construction,
): number => {
  const yields = attacker.yields
    .only(["yieldType:attack", "yieldType:strength"], getTypes(attacker), getTypes(defender))
    .applyMods();

  return roundToTenth(
    yields.getLumpAmount("yieldType:attack") + yields.getLumpAmount("yieldType:strength"),
  );
};

export const defenseStrength = (
  attacker: City | Unit,
  defender: Unit | City | Construction,
): number => {
  const yields = defender.yields
    .only(["yieldType:defense", "yieldType:strength"], getTypes(defender), getTypes(attacker))
    .applyMods();

  return roundToTenth(
    yields.getLumpAmount("yieldType:defense") + yields.getLumpAmount("yieldType:strength"),
  );
};

export const calcDamage = (
  attackStrength: number,
  defenseStrength: number,
): { attackerDamage: number; defenderDamage: number } => {
  const attackerDamage = rawDamage(attackStrength, defenseStrength);
  const defenderDamage = rawDamage(defenseStrength, attackStrength);

  return {
    attackerDamage: roundToTenth(Math.min(100, Math.max(0, attackerDamage))),
    defenderDamage: roundToTenth(Math.min(100, Math.max(0, defenderDamage))),
  };
};

// Damage is between 0 and 100, grows exponentially the more difference in strength
const rawDamage = (strengthA: number, strengthB: number): number => {
  // A is stronger than B
  if (strengthA - strengthB > 0) {
    const pow1 = 1.65;
    const multiplier1 = 60;
    const addition1 = 30;

    return (strengthA / strengthB - 1) ** pow1 * multiplier1 + addition1;
  }

  // A and B are equal
  if (roundToTenth(strengthA - strengthB) === 0) {
    return 30;
  }

  // B is stronger than A
  const pow2 = 0.8;
  const multiplier2 = 65;
  const addition2 = -0.7;
  const addition3 = 14;

  return ((strengthA / strengthB) ** pow2 + addition2) * multiplier2 + addition3;
};

const getTypes = (obj: City | Construction | Unit): TypeObject[] => {
  if (obj instanceof City) return [obj.concept];
  if (obj instanceof Construction) return [obj.concept, obj.type];
  return obj.types;
};
