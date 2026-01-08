# Fact Sheet — Strategic Plans & Priorities

This document defines **Strategic Plans** and **Strategic Priorities** as the bridge between high-level intent and concrete execution.
It contains only factual rules.

---

## 1. Purpose

- Strategic Plans explain **what a player is preparing for**.
- Strategic Priorities explain **what the player is trying to improve right now**.
- Together, they connect:
  - world state → intent → resource focus → regional execution

Neither Plans nor Priorities are actions.

---

## 2. Strategic Plans

### 2.1 What a Strategic Plan Is

- A Strategic Plan is an **internal, non-binding preparation** toward a possible future outcome.
- Plans are not public.
- Plans do not grant powers or permissions.
- Plans never justify escalation by themselves.

Plans represent thinking, not commitment.

---

### 2.2 How Plans Are Formed

Plans are formed from observable facts:
- Resource needs and shortages
- Relations (Alignment, Trust, Pressure, Military Power)
- Geography and proximity
- Existing agendas and incidents

Plans may coexist and compete.

---

### 2.3 What Plans Do

Plans:
- Bias how priorities are weighted
- Bias unit placement and posture
- Bias output spending (Influence, Faith)
- Delay or accelerate agenda declaration

Plans do **not**:
- Appear in the UI
- Trigger incidents
- Override hard rules

---

### 2.4 Plan Lifecycle

- Plans may be created, adjusted, or abandoned freely.
- Abandoning a plan has no penalty.
- A plan may crystallize into a **public agenda** when conditions are met.

---

## 3. Strategic Priorities

### 3.1 What a Strategic Priority Is

- A Strategic Priority is a **ranked objective** for the current period.
- Priorities are outputs of the strategic layer.
- Priorities are consumed by regional and city-level AI.

Priorities express *what matters*, not *how to do it*.

---

### 3.2 Priority Scope

Each priority defines:
- **Domain** (military, diplomacy, economy, religion, stability)
- **Scope** (global, region, border, city)
- **Direction** (increase, decrease, maintain)
- **Urgency** (relative ranking)

Priorities are comparable and compete for resources.

---

### 3.3 Priority Examples

- Increase military power on the eastern border
- Reduce Tension in capital region
- Increase influence output
- Prepare leverage against Neighbor A
- Stabilize unrest in Region B

---

## 4. Relationship Between Plans and Priorities

- Plans influence **which priorities are generated**.
- Priorities are the **only interface** between strategy and execution.
- Regional and city AI resolve priorities into concrete actions.

Strategic AI never selects specific buildings or units.

---

## 5. Execution Boundary

- Strategic AI:
  - Forms plans
  - Generates and ranks priorities

- Regional / City AI:
  - Chooses constructions and training
  - Places units
  - Resolves conflicts between priorities

This boundary is strict.

---

## 6. Interaction with Agendas and Incidents

- Plans may exist without agendas.
- Declaring an agenda is a **public commitment**, not a plan.
- Active incidents constrain available priorities.

Plans may increase readiness for escalation without making intent public.

---

## 7. Difficulty Interaction

Difficulty affects:
- How many plans are considered simultaneously
- How far ahead plans are evaluated
- How quickly plans adapt to new information

Difficulty does not change what plans are allowed.

---

## 8. Explainability

- All priority outputs must be explainable via:
  - Plans
  - Relations
  - Tension
  - Resource state

Players can infer plans from visible behavior, but plans are never exposed directly.

---

## 9. Invariants

- Plans are internal and non-binding.
- Priorities are ranked and finite.
- Strategy never issues concrete build or training orders.
- All actions remain bound by presence, access, and escalation rules.

If execution bypasses priorities or plans override rules, it is invalid.

