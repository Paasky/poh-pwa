# AI Strategic Espionage Model

## Purpose
Define the **Espionage system** as a local, high-risk pressure tool that integrates with:
- Incidents
- Reputation
- Diplomacy
- Tension management

Espionage accelerates consequences and reveals reality.
It never fabricates outcomes or bypasses player agency.

---

## Core Principles

- Espionage is **city-scoped**
- Espionage requires **presence** (spy units)
- Espionage applies **pressure**, not direct outcomes
- Espionage creates **suspicion**, which must be countered
- All effects are deterministic and explainable

---

## Spy Units

- Spies are assigned to **cities**
- Spies have **influence upkeep**
- If influence reaches zero, spies are disbanded first

Multiple spies may operate in the same city.

---

## Suspicion State

Each city tracks a **Suspicion State**:
- Calm
- Suspicious

Suspicion:
- Increases when espionage missions start or spike
- Never returns to Calm while hostile spies remain
- Can only be cleared by a successful counter-espionage sweep

Suspicion feeds into the city’s broader **tension meter**.

---

## Mission Structure

- Missions are **continuous** once started
- Starting a mission freezes the spy:
  - Capital: 2 turns
  - Other cities: 5 turns
- After unfreezing, the mission applies ongoing effects

Multiple spies:
- Increase success probability
- Increase resilience (work continues if one spy is removed)
- Do not suppress suspicion

---

## Espionage Action Categories

### A. Information

#### Local Visibility
- Spies provide standard local visibility like other units

#### Infiltrate Government
- Reveals aggregated **diplomatic / missionary / espionage heatmaps**
- No unit identities or exact counts

#### Infiltrate Military
- Reveals aggregated **military concentration heatmap**
- Information decays quickly

#### Infiltrate Diplomacy
- Reveals **one secret promise tied to the active incident**, if any exist
- If none exist:
  - Grants a temporary bonus to your side’s influence efficiency in that incident

---

### B. Pressure

#### Promote Culture / Policy / Religion
- Low-level generic action
- Small per-turn population drift
- Raises mild suspicion
- Available without agendas or incidents

#### Spread Disinformation
- Ongoing mission
- Increases **discontent** per turn
- Only one such mission allowed per target player

#### Build Criminal Network
- Ongoing mission
- Increases **corruption** per turn
- Only one such mission allowed per target player

Pressure effects:
- Scale with city size
- Are capped per city
- Stop immediately if the spy is removed

Pressure effects are **2× effective** in incident-scoped cities.

---

### C. Acceleration

#### Incite Cultural / Political / Religious Fervor
- Requires an active **agenda or incident**
- Stronger pressure than Promote actions
- Rapidly raises tension

#### Sabotage
- Requires an active incident
- On success:
  - Forces an immediate **Raise / Call / Fold** decision by both primary sides
- Detection risk is high

If sabotage is detected:
- Apply **Belligerence −1 (slow)** (Aggressor tag)
- Grants strong justification to the opposing side
- No automatic escalation occurs

---

## Detection and Counter-Espionage

### Detection

A spy may be detected if:
- A mission completes
- A mission fails badly
- A counter-espionage sweep succeeds

Detection reveals:
- Presence of espionage
- Type of activity
- Not the spy’s identity

---

### Counter-Espionage: Sweep City

- Assigned to a specific city
- Requires Suspicion ≥ threshold
- Duration:
  - Capital: 2 turns
  - Other cities: 5 turns
- Spy is frozen during sweep

Outcomes:
- If hostile spies exist:
  - Chance to detect
- If none exist:
  - Suspicion state resets to Calm

After detection, the defender may:
1. **Quietly expel** the spy
   - No incident
   - Small tension increase
2. **Publicly accuse**
   - Large tension increase
   - May create or strengthen a Minor Incident

---

## Interaction with Incidents

Spies may:
- Increase tension
- Accelerate escalation clocks
- Reveal bluffing or hidden commitments
- Enable Minor → Major incident escalation

Spies may not:
- Choose escalation actions
- Escalate incidents directly to war
- Replace diplomats

---

## Interaction with Reputation

- Detected espionage may trigger reputation effects
- Sabotage detection applies Belligerence penalties
- Spies reveal real behavior; they never fabricate tags

---

## Strategic AI Usage

AI uses espionage to:
- Focus on high-tension cities
- Break deadlocks in incidents
- Reveal hidden commitments
- Undermine opponents during low-conflict phases

AI does not simulate narratives; it allocates spies based on:
- Tension
- Agenda relevance
- Reputation goals

---

## Hard Constraints

- Espionage is always city-local
- Suspicion cannot clear without a successful sweep
- No random fabrication of outcomes
- No direct war triggers

---

## Design Intent

This system exists to:
- Make espionage dangerous but fair
- Tie covert action to visible escalation
- Reward preparation and restraint
- Preserve player agency at every step

If espionage creates outcomes without explanation or counterplay, it is a bug.

