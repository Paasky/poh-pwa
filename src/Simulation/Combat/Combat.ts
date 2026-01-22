import { City } from "@/Common/Models/City";
import { Unit } from "@/Common/Models/Unit";
import { Construction } from "@/Common/Models/Construction";
import { attackStrength, calcDamage, defenseStrength } from "@/Simulation/Combat/Strength";
import { createMutation, PohMutation, mergeMutations } from "@/Common/PohMutation";
import { MovementManager } from "@/Simulation/Movement/MovementManager";
import { Health } from "@/Simulation/Common/Health";

export class Combat {
  constructor(
    private readonly attacker: City | Unit,
    private readonly defender: Construction | City | Unit,
  ) {}

  getDamage(): { attackerDamage: number; defenderDamage: number } {
    return calcDamage(
      attackStrength(this.attacker, this.defender),
      defenseStrength(this.attacker, this.defender),
    );
  }

  melee(): PohMutation[] {
    const mutations = [] as PohMutation[];

    const damage = this.getDamage();

    const attackerHealthMutation = new Health(this.attacker).modify(-damage.attackerDamage);
    if (attackerHealthMutation) mutations.push(attackerHealthMutation);

    const defenderHealthMutation = new Health(this.defender).modify(-damage.defenderDamage);
    if (defenderHealthMutation) mutations.push(defenderHealthMutation);

    // If the attacker is not dead, set canAttack & moves
    if (this.attacker.health > 0) {
      const attackerMutation = createMutation("update", this.attacker.key);
      // todo: add attacker experience

      // Can only attack once per turn
      this.attacker.canAttack = false;
      attackerMutation.payload.canAttack = false;

      if (this.attacker instanceof Unit) {
        // If the defender is dead, move to their tile
        if (this.defender.health <= 0) {
          mutations.push(MovementManager.moveTo(this.attacker, this.defender.tile));
        }

        // If the attacker cannot move after attack, set moves to 0
        if (!this.attacker.myTypes.some((type) => type.key === "specialType:canMoveAfterAttack")) {
          this.attacker.movement.moves = 0;
          attackerMutation.payload.moves = 0;
        }
      }
    }

    if (this.defender.health > 0) {
      // todo: add defender experience
    }

    return mergeMutations(mutations);
  }

  bombard(): PohMutation[] {
    const mutations = [] as PohMutation[];

    const damage = this.getDamage();

    const attackerMutation = createMutation("update", this.attacker.key);

    // todo: add attacker experience

    // Can only attack once per turn
    this.attacker.canAttack = false;
    attackerMutation.payload.canAttack = false;

    if (this.attacker instanceof Unit) {
      // If the attacker cannot move after attack, set moves to 0
      if (!this.attacker.myTypes.some((type) => type.key === "specialType:canMoveAfterAttack")) {
        this.attacker.movement.moves = 0;
        attackerMutation.payload.moves = 0;
      }
    }

    // Defender loses health
    const defenderHealthMutation = new Health(this.defender).modify(-damage.defenderDamage);
    if (defenderHealthMutation) mutations.push(defenderHealthMutation);

    if (this.defender.health > 0) {
      // todo: add defender experience
    }

    return mergeMutations(mutations);
  }
}
