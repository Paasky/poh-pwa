import { Construction } from "@/Common/Models/Construction";
import { Unit } from "@/Common/Models/Unit";
import { City } from "@/Common/Models/City";
import { TypeObject } from "@/Common/Objects/TypeObject";
import { roundToTenth } from "@/Common/Objects/World";
import { clamp } from "@/Common/Helpers/basicMath";

export const attackStrength = (
  attacker: City | Unit,
  defender: Unit | City | Construction,
): number => {
  const yields = attacker.yields.flatten(
    ["yieldType:attack", "yieldType:strength"],
    attacker.types,
    defender.types,
  );

  return roundToTenth(
    yields.getLumpAmount("yieldType:attack") + yields.getLumpAmount("yieldType:strength"),
  );
};

export const defenseStrength = (
  attacker: City | Unit,
  defender: Unit | City | Construction,
): number => {
  const yields = defender.yields.flatten(
    ["yieldType:defense", "yieldType:strength"],
    defender.types,
    attacker.types,
  );

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
    attackerDamage: roundToTenth(clamp(attackerDamage, 0, 100)),
    defenderDamage: roundToTenth(clamp(defenderDamage, 0, 100)),
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

const getTypes = (obj: City | Construction | Unit): Set<TypeObject> => {
  return obj.types;
};
