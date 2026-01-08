# AI Strategic Personalities

## Purpose
Defines the personality system driving AI strategic decision-making.
Personalities bias decisions via weights, not hard rules.
They evolve over time through crises and epoch changes.

This system is:
- Deterministic
- Explainable
- Player-visible
- Architecturally cheap

---

## Core Model

Each player (human or AI) has **three personality axes**.
Each axis has **three discrete values**.

Total combinations: **27**.

Axes are orthogonal and additive.
No axis unlocks or forbids actions.
All effects are weight modifiers only.

---

## Axis 1: Leadership

**Question:** How does the state resolve internal failure?

### Pragmatic
- Prioritizes efficiency and survival
- Switches tactics easily
- Accepts short-term losses for stability

Weight Bias:
- Reform > War > Revolution
- Accepts asymmetric treaties
- Cancels failing agendas early

---

### Authoritarian
- Prioritizes control and order
- Uses suppression to manage instability
- Avoids concessions

Weight Bias:
- Order enforcement > Reform
- Treaty breaking under pressure
- War as distraction from unrest

---

### Reformist
- Prioritizes legitimacy and long-term cohesion
- Accepts structural change
- Avoids repression

Weight Bias:
- Reform > Revolution > War
- Willing to back down from incidents
- Uses policy change to solve crises

---

## Axis 2: Identity

**Question:** Who belongs, and on what terms?

### Cosmopolitan
- Tolerates foreign cultures and religions
- Benefits from diversity
- Penalized by xenophobic pressure

Weight Bias:
- Open borders
- Cultural/religious concessions
- Lower unrest from foreign pops

---

### Nationalistic
- Prioritizes core culture
- Suspicious of outsiders
- Identity tied to territory

Weight Bias:
- Border defense
- Cultural dominance agendas
- Resistance to vassalization

---

### Zealous
- Identity defined by belief or ideology
- Intolerant of deviation
- High internal cohesion, high friction

Weight Bias:
- Religious/cultural enforcement
- Schisms and purges
- Holy wars and ideological incidents

---

## Axis 3: Diplomacy

**Question:** How are goals pursued externally?

### Legalist
- Respects treaties and norms
- Avoids unjustified wars
- Values reputation

Weight Bias:
- Agenda-first conflicts
- Incident escalation restraint
- Coalition-building

---

### Opportunist
- Flexible and situational
- Exploits weakness
- Breaks promises when profitable

Weight Bias:
- Join winning sides
- Late escalation
- Conditional treaty support

---

### Aggressor
- Uses force proactively
- High risk tolerance
- Low regard for norms

Weight Bias:
- Preemptive wars
- Threat-based treaties
- Escalation preference

---

## Personality Display Rules

Primary display format:

> Leader Name
> Leadership / Identity / Diplomacy

Example:
- Julius Caesar (Authoritarian / Nationalistic / Aggressor)
- Gandhi (Reformist / Nationalistic / Legalist)

No hard government names are required.
Optional soft archetypes may exist for encyclopedia flavor only.

---

## Evolution Rules

Personalities are **stable within an epoch**.
They may only change during **crisis-triggered epoch transitions**.

Normal leadership changes do not alter axes.

---

## Crisis → Epoch Change Outcomes (Rule of Three)

When a player enters a crisis and triggers an epoch change, exactly one of the following paths is chosen:

---

### 1. Reform

**Description:**
- Systemic reform without state collapse

**Effects:**
- Corruption & discontent partially reset
- Stability improves slowly
- No territorial split

**Personality Change:**
- Change **1 axis**

**Strategic Bias:**
- Preferred by Reformist leaders
- Slower recovery, lower risk

---

### 2. Civil War — Loyalist Side

**Description:**
- Conservative faction retains legitimacy
- State splits into two players

**Effects:**
- Corruption & discontent fully reset
- Easier civil war
- Fewer systemic changes allowed

**Personality Change:**
- Change **1 axis**

**Strategic Bias:**
- Preferred by Authoritarian leaders
- Faster stabilization, limited transformation

---

### 3. Civil War — Revolutionary Side

**Description:**
- Radical restructuring of the state
- State splits into two players

**Effects:**
- Corruption & discontent fully reset
- Harder civil war
- Deep systemic overhaul

**Personality Change:**
- Change **2 axes**

**Strategic Bias:**
- High risk, high reward
- Enables major behavioral pivots

---

## Hard Constraints

- Only crisis-triggered epoch changes may alter personality
- No more than 2 axes may change at once
- Axis values are discrete and exclusive
- Personality never overrides hard rules

---

## Design Intent

This system exists to:
- Prevent static AI behavior
- Create readable, explainable strategy shifts
- Tie internal failure to long-term evolution
- Support multiple viable victory paths

Coding note:
Personality axes are input weights to all strategic evaluations.
They are not state machines, scripts, or behavior trees.

