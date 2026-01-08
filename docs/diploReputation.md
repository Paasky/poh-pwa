# AI Strategic Reputation Memory

## Purpose
Define the **Reputation system** as a long-term memory of observed behavior.
Reputation explains *trust, fear, and tolerance* across diplomacy, incidents, and agendas.

Reputation is:
- Axis-based (not a single score)
- Slow to change
- Queried contextually by AI
- Visible and explainable to players

Reputation is **not** mood or relations.

---

## Core Model

Reputation is represented by **three orthogonal axes**:

A. **Dependability** – keeps their word in deals, agendas, and incidents
B. **Belligerence** – escalates conflicts vs restrains and mediates
C. **Interference** – meddles in others’ internal affairs vs pluralist / hands-off

Each axis ranges conceptually from **−3 … 0 … +3**.

---

## Axis Definitions

### A. Dependability
> “Can I trust your commitments?”

Negative behaviors:
- Breaking deals
- Breaking agenda commitments
- Backing out of incidents after committing
- Breaking revealed secret promises

Positive behaviors:
- Completing contracts
- Renewing deals early
- Honoring incident commitments
- Long streaks without breaches

Gameplay effects:
- Modifies acceptance of deferred clauses (GPT, access, pacts)
- Weights willingness to enter long-term agreements

---

### B. Belligerence
> “Do you escalate or restrain conflict?”

Negative behaviors:
- Aggressor tagging in incidents
- Repeated war escalation
- Refusing settlements repeatedly

Positive behaviors:
- Defending allies
- Mediating incidents
- Accepting forced settlements
- Joining wars defensively

Gameplay effects:
- Modifies third-party support in incidents
- Affects coalition formation

---

### C. Interference
> “Do you meddle in other societies?”

Negative behaviors:
- Forced religious conversion
- Cultural suppression
- Policy manipulation via spies
- Heavy-handed missionary pressure

Positive behaviors:
- Religious pluralism
- Protecting minorities
- Low-interference diplomacy
- Cultural tolerance

Gameplay effects:
- Modifies acceptance of missionaries and spies
- Influences ideological blocs and resistance

---

## Scoring and Events

Reputation changes are applied as **discrete events**, not continuous drift.

Each event modifies one axis by:
- Direction (+ / −)
- Severity (fast or slow)

Examples:
- Breaking a deal → Dependability −1 (slow)
- Renewing a deal → Dependability +1 (fast)
- Being tagged Aggressor → Belligerence −1 (slow)
- Mediating an incident → Belligerence +1 (fast)

---

## Decay Model

Each reputation change has a decay class:

### Fast Decay
- Duration: ~50 turns
- Effect:
  - First half: 100%
  - Second half: 50%
  - Then removed

### Slow Decay
- Duration: ~100 turns
- Effect:
  - First half: 100%
  - Second half: 50%
  - Then removed

Decay is **stepwise**, not linear.

---

## Cancellation Rules

Positive and negative effects cancel **within the same axis only**.

Rules:
- **2× fast positive** removes **1× fast negative**
- **4× slow positive** removes **1× slow negative**
- **1× slow negative** removes all fast positives on that axis

This enforces:
- Bad behavior is fast and costly
- Redemption is possible but slow

---

## Multipliers and Soft Gates

Each axis applies a **multiplier** to relevant AI decisions.

Example (Belligerence):
- −1 → ×0.85
- −2 → ×0.6
- −3 → ×0.3
- −4 → ×0.1

At extreme values:
- Actions are technically possible
- But costs and resistance make them impractical

This creates de-facto gates ("everyone hates you") without hard locks.

---

## Personality Interaction

AI personalities weight axes differently:

- Legalist: overweights Dependability
- Aggressor: discounts Belligerence negatives
- Zealous: overweights Interference
- Opportunist: discounts all axes faster

Same reputation produces different reactions.

---

## Visibility and UX

Players must always be able to see:
- Current axis states
- Recent events affecting them
- Tooltips explaining consequences

AI refusals should reference reputation explicitly.

---

## Revolution and Reset

On **Revolutionary Epoch Change**:
- All reputation axes reset to neutral
- All pending decay timers are cleared
- Add temporary tag: `UnprovenRegime` (fast decay)

This enables collapse → resurgence gameplay.

---

## Hard Constraints

- No fabricated reputation events
- Spies may reveal behavior, not invent it
- Reputation never directly modifies combat
- Max conceptual range per axis is bounded

---

## Design Intent

This system exists to:
- Make long-term behavior matter
- Encourage restraint and credibility
- Punish bullying through coalition dynamics
- Allow redemption through consistent play

If reputation effects cannot be explained by observable actions, it is a bug.

